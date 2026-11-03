using System.Net;
using System.Text;
using AuraLogbook.Api.Configuration;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.Spotify;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

public sealed class SpotifyServiceTests
{
    [Fact]
    public void CreateAuthorizationUrl_contains_required_oauth_parameters()
    {
        var service = CreateService(new StubHttpMessageHandler(_ => Json("{}")), out _);

        var url = service.CreateAuthorizationUrl(42);

        Assert.Contains("client_id=test-client", url);
        Assert.Contains("response_type=code", url);
        Assert.Contains("redirect_uri=http%3A%2F%2Flocalhost%3A5082%2Fapi%2Fspotify%2Fcallback", url);
        Assert.Contains("state=", url);
        Assert.Contains("playlist-read-private", url);
    }

    [Fact]
    public async Task CompleteAuthorizationAsync_encrypts_tokens_before_persisting()
    {
        var repository = new Mock<ISpotifyConnectionRepository>();
        var service = CreateService(new StubHttpMessageHandler(request =>
        {
            if (request.RequestUri!.Host == "accounts.spotify.com")
                return Json("{\"access_token\":\"access\",\"refresh_token\":\"refresh\",\"expires_in\":3600}");
            return Json("{\"id\":\"spotify-user\"}");
        }), out _ , repository);
        var authorizationUrl = service.CreateAuthorizationUrl(7);
        var state = authorizationUrl.Split("state=", StringSplitOptions.None)[1];

        await service.CompleteAuthorizationAsync(Uri.UnescapeDataString(state), "code", CancellationToken.None);

        repository.Verify(x => x.SaveAsync(It.Is<SpotifyConnectionRecord>(record =>
            record.UserId == 7 &&
            record.SpotifyUserId == "spotify-user" &&
            record.EncryptedAccessToken != "access" &&
            record.EncryptedRefreshToken != "refresh")), Times.Once);
    }

    [Fact]
    public async Task GetCurrentlyPlayingAsync_returns_spotify_metadata()
    {
        var protector = DataProtectionProvider.Create("AuraLogbook.Tests").CreateProtector("AuraLogbook.SpotifyTokens.v1");
        var repository = new Mock<ISpotifyConnectionRepository>();
        repository.Setup(x => x.GetAsync(9)).ReturnsAsync(new SpotifyConnectionRecord
        {
            UserId = 9,
            EncryptedAccessToken = protector.Protect("access"),
            EncryptedRefreshToken = protector.Protect("refresh"),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        });
        var service = CreateService(new StubHttpMessageHandler(request =>
        {
            Assert.Equal("Bearer", request.Headers.Authorization?.Scheme);
            Assert.Equal("access", request.Headers.Authorization?.Parameter);
            return Json("{\"item\":{\"name\":\"Still\",\"type\":\"track\"}}");
        }), out _, repository, protector);

        var result = await service.GetCurrentlyPlayingAsync(9, CancellationToken.None);

        Assert.Contains("Still", result);
    }

    private static SpotifyService CreateService(HttpMessageHandler handler, out IDataProtector protector, Mock<ISpotifyConnectionRepository>? repository = null, IDataProtector? sharedProtector = null)
    {
        protector = sharedProtector ?? DataProtectionProvider.Create("AuraLogbook.Tests").CreateProtector("AuraLogbook.SpotifyTokens.v1");
        var client = new HttpClient(handler);
        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(x => x.CreateClient(It.IsAny<string>())).Returns(client);
        return new SpotifyService(
            Options.Create(new SpotifyOptions { ClientId = "test-client", ClientSecret = "test-secret", RedirectUri = "http://localhost:5082/api/spotify/callback" }),
            repository?.Object ?? new Mock<ISpotifyConnectionRepository>().Object,
            factory.Object,
            new TestProtectionProvider(protector));
    }

    private static HttpResponseMessage Json(string body) => new(HttpStatusCode.OK) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> callback) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(callback(request));
    }

    private sealed class TestProtectionProvider(IDataProtector protector) : IDataProtectionProvider
    {
        public IDataProtector CreateProtector(string purpose) => protector;
    }
}
