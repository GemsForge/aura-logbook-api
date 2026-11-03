using System.Net;
using System.Security.Cryptography;
using System.Text;
using AuraLogbook.Api.Configuration;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.Spotify;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>Exercises OAuth, normalized metadata and token renewal without real Spotify credentials.</summary>
public sealed class SpotifyServiceTests
{
    private sealed class Fixture
    {
        public Mock<ISpotifyConnectionRepository> Repository { get; } = new();
        public IDataProtectionProvider Protection { get; } = new EphemeralDataProtectionProvider();
        public SpotifyConnectionRecord? Record;
        public SpotifyAuthorizationAttempt? Attempt;
        public int Requests;
        public Func<HttpRequestMessage, Task<HttpResponseMessage>> Send = _ => Task.FromResult(Json("{}"));

        public Fixture()
        {
            Repository.Setup(x => x.GetAsync(It.IsAny<int>())).ReturnsAsync(() => Record);
            Repository.Setup(x => x.SaveAsync(It.IsAny<SpotifyConnectionRecord>()))
                .Callback<SpotifyConnectionRecord>(record => Record = record).Returns(Task.CompletedTask);
            Repository.Setup(x => x.DeleteAsync(It.IsAny<int>())).Callback(() => Record = null).Returns(Task.CompletedTask);
            Repository.Setup(x => x.SaveAttemptAsync(It.IsAny<SpotifyAuthorizationAttempt>()))
                .Callback<SpotifyAuthorizationAttempt>(attempt => Attempt = attempt).Returns(Task.CompletedTask);
            Repository.Setup(x => x.ConsumeAttemptAsync(It.IsAny<string>())).ReturnsAsync((string hash) =>
            {
                if (Attempt?.StateHash != hash) return null;
                var result = Attempt;
                Attempt = null;
                return result;
            });
        }

        public SpotifyService Service(bool configured = true)
        {
            var handler = new Handler(async request => { Requests++; return await Send(request); });
            var clients = new Mock<IHttpClientFactory>();
            clients.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(() => new HttpClient(handler, false));
            return new SpotifyService(Options.Create(new SpotifyOptions
            {
                ClientId = configured ? "client" : "", ClientSecret = configured ? "secret" : ""
            }), Repository.Object, clients.Object, Protection);
        }

        public void Connected(bool expired = false)
        {
            var protector = Protection.CreateProtector("AuraLogbook.SpotifyTokens.v1");
            Record = new SpotifyConnectionRecord
            {
                UserId = 7, SpotifyUserId = "account",
                EncryptedAccessToken = protector.Protect("access"),
                EncryptedRefreshToken = protector.Protect("refresh"),
                ExpiresAt = DateTime.UtcNow.AddMinutes(expired ? -5 : 20)
            };
        }
    }

    [Fact]
    public async Task Authorization_survives_service_recreation_and_is_single_use()
    {
        var fixture = new Fixture();
        var query = QueryHelpers.ParseQuery(new Uri(await fixture.Service().CreateAuthorizationUrlAsync(7)).Query);
        Assert.Equal("S256", query["code_challenge_method"]);
        Assert.Equal("http://127.0.0.1:5082/api/spotify/callback", query["redirect_uri"]);
        fixture.Send = async request =>
        {
            if (request.Method == HttpMethod.Post)
            {
                var form = QueryHelpers.ParseQuery(await request.Content!.ReadAsStringAsync());
                var verifier = form["code_verifier"].ToString();
                Assert.Equal(query["code_challenge"], WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.UTF8.GetBytes(verifier))));
                return Json("""{"access_token":"access","refresh_token":"refresh","expires_in":3600}""");
            }
            return Json("""{"account_id":"new-account-id"}""");
        };
        await fixture.Service().CompleteAuthorizationAsync(query["state"]!, "code", default);
        Assert.Equal("new-account-id", fixture.Record!.SpotifyUserId);
        Assert.Equal("access", fixture.Protection.CreateProtector("AuraLogbook.SpotifyTokens.v1").Unprotect(fixture.Record.EncryptedAccessToken));
        Assert.NotEqual("refresh", fixture.Record.EncryptedRefreshToken);
        var error = await Assert.ThrowsAsync<SpotifyIntegrationException>(() => fixture.Service().CompleteAuthorizationAsync(query["state"]!, "code", default));
        Assert.Equal("state-error", error.Code);
        Assert.Equal(2, fixture.Requests);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Rejects_invalid_or_expired_state_before_network_access(bool expired)
    {
        var fixture = new Fixture();
        var query = QueryHelpers.ParseQuery(new Uri(await fixture.Service().CreateAuthorizationUrlAsync(7)).Query);
        if (expired) fixture.Attempt!.ExpiresAt = DateTime.UtcNow.AddSeconds(-1);
        var error = await Assert.ThrowsAsync<SpotifyIntegrationException>(() =>
            fixture.Service().CompleteAuthorizationAsync(expired ? query["state"]! : "tampered", "code", default));
        Assert.Equal("state-error", error.Code);
        Assert.Equal(0, fixture.Requests);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Refreshes_expired_credentials_and_preserves_or_rotates_refresh_token(bool rotate)
    {
        var fixture = new Fixture();
        fixture.Connected(expired: true);
        var protector = fixture.Protection.CreateProtector("AuraLogbook.SpotifyTokens.v1");
        fixture.Send = async request =>
        {
            if (request.Method == HttpMethod.Post)
            {
                var form = QueryHelpers.ParseQuery(await request.Content!.ReadAsStringAsync());
                Assert.Equal("refresh", form["refresh_token"]);
                return Json(rotate
                    ? """{"access_token":"renewed","refresh_token":"rotated","expires_in":3600}"""
                    : """{"access_token":"renewed","expires_in":3600}""");
            }
            Assert.Equal("renewed", request.Headers.Authorization!.Parameter);
            return Json("""{"items":[null,{"id":"one","name":"Evening","images":[],"external_urls":{"spotify":"https://open.spotify.com/playlist/one"}}],"next":null}""");
        };
        var result = await fixture.Service().GetPlaylistsAsync(7, default);
        Assert.Single(result.Items);
        Assert.Equal("Evening", result.Items[0].Name);
        Assert.Equal(rotate ? "rotated" : "refresh", protector.Unprotect(fixture.Record!.EncryptedRefreshToken));
    }

    [Fact]
    public async Task Parallel_metadata_requests_refresh_only_once()
    {
        var fixture = new Fixture();
        fixture.Connected(expired: true);
        var refreshes = 0;
        fixture.Send = async request =>
        {
            if (request.Method == HttpMethod.Post)
            {
                Interlocked.Increment(ref refreshes);
                await Task.Yield();
                return Json("""{"access_token":"renewed","expires_in":3600}""");
            }
            return request.RequestUri!.AbsolutePath.EndsWith("/playlists")
                ? Json("""{"items":[]}""") : new(HttpStatusCode.NoContent);
        };
        await Task.WhenAll(fixture.Service().GetPlaylistsAsync(7, default), fixture.Service().GetCurrentlyPlayingAsync(7, default));
        Assert.Equal(1, refreshes);
    }

    [Fact]
    public async Task No_playback_returns_null_and_uses_matching_endpoint()
    {
        var fixture = new Fixture();
        fixture.Connected();
        fixture.Send = request =>
        {
            Assert.EndsWith("/me/player/currently-playing", request.RequestUri!.AbsolutePath);
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NoContent));
        };
        Assert.Null(await fixture.Service().GetCurrentlyPlayingAsync(7, default));
    }

    [Fact]
    public async Task Rejected_metadata_returns_safe_recoverable_error()
    {
        var fixture = new Fixture();
        fixture.Connected();
        fixture.Send = _ => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Forbidden));
        var error = await Assert.ThrowsAsync<SpotifyIntegrationException>(() => fixture.Service().GetPlaylistsAsync(7, default));
        Assert.Equal("access-denied", error.Code);
        Assert.Equal(403, error.StatusCode);
    }

    [Fact]
    public async Task Unconfigured_and_disconnected_states_do_not_call_spotify()
    {
        var fixture = new Fixture();
        Assert.False((await fixture.Service(false).GetConnectionAsync(7)).Configured);
        await Assert.ThrowsAsync<SpotifyIntegrationException>(() => fixture.Service(false).CreateAuthorizationUrlAsync(7));
        await Assert.ThrowsAsync<SpotifyIntegrationException>(() => fixture.Service().GetPlaylistsAsync(7, default));
        Assert.Equal(0, fixture.Requests);
    }

    private static HttpResponseMessage Json(string body) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(body, Encoding.UTF8, "application/json")
    };

    private sealed class Handler(Func<HttpRequestMessage, Task<HttpResponseMessage>> send) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => send(request);
    }
}
