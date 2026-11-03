using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text.Json;
using AuraLogbook.Api.Configuration;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.Spotify;

/// <summary>Implements Spotify OAuth and metadata calls without exposing provider tokens.</summary>
public sealed class SpotifyService : ISpotifyService
{
    private static readonly ConcurrentDictionary<string, (int UserId, DateTimeOffset ExpiresAt)> States = new();
    private readonly SpotifyOptions _options;
    private readonly ISpotifyConnectionRepository _repository;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IDataProtector _protector;

    public SpotifyService(IOptions<SpotifyOptions> options, ISpotifyConnectionRepository repository, IHttpClientFactory httpClientFactory, IDataProtectionProvider protectionProvider)
    {
        _options = options.Value;
        _repository = repository;
        _httpClientFactory = httpClientFactory;
        _protector = protectionProvider.CreateProtector("AuraLogbook.SpotifyTokens.v1");
    }

    public string CreateAuthorizationUrl(int userId)
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId)) throw new InvalidOperationException("Spotify is not configured.");
        var state = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        States[state] = (userId, DateTimeOffset.UtcNow.AddMinutes(10));
        var scopes = "user-read-currently-playing playlist-read-private playlist-read-collaborative user-read-email";
        return $"https://accounts.spotify.com/authorize?client_id={Uri.EscapeDataString(_options.ClientId)}&response_type=code&redirect_uri={Uri.EscapeDataString(_options.RedirectUri)}&scope={Uri.EscapeDataString(scopes)}&state={Uri.EscapeDataString(state)}";
    }

    public async Task CompleteAuthorizationAsync(string state, string code, CancellationToken cancellationToken)
    {
        if (!States.TryRemove(state, out var pending) || pending.ExpiresAt < DateTimeOffset.UtcNow) throw new InvalidOperationException("Spotify authorization state is invalid or expired.");
        using var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}")));
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string> { ["grant_type"] = "authorization_code", ["code"] = code, ["redirect_uri"] = _options.RedirectUri });
        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var access = json.RootElement.GetProperty("access_token").GetString()!;
        var refresh = json.RootElement.GetProperty("refresh_token").GetString()!;
        var expires = DateTime.UtcNow.AddSeconds(json.RootElement.GetProperty("expires_in").GetInt32());
        var profile = await GetSpotifyUserAsync(access, cancellationToken);
        var now = DateTime.UtcNow;
        await _repository.SaveAsync(new SpotifyConnectionRecord { UserId = pending.UserId, SpotifyUserId = profile, EncryptedAccessToken = _protector.Protect(access), EncryptedRefreshToken = _protector.Protect(refresh), ExpiresAt = expires, CreatedAt = now, UpdatedAt = now });
    }

    public async Task<bool> IsConnectedAsync(int userId) => await _repository.GetAsync(userId) is not null;
    public Task DisconnectAsync(int userId) => _repository.DeleteAsync(userId);

    public async Task<string?> GetCurrentlyPlayingAsync(int userId, CancellationToken cancellationToken)
        => await GetSpotifyAsync(userId, "me/player", cancellationToken, allowNoContent: true);

    public async Task<string> GetPlaylistsAsync(int userId, CancellationToken cancellationToken)
        => await GetSpotifyAsync(userId, "me/playlists", cancellationToken) ?? "{}";

    private async Task<string?> GetSpotifyAsync(int userId, string path, CancellationToken cancellationToken, bool allowNoContent = false)
    {
        var connection = await _repository.GetAsync(userId) ?? throw new InvalidOperationException("Spotify is not connected.");
        using var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.ApiBaseUrl.TrimEnd('/')}/{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _protector.Unprotect(connection.EncryptedAccessToken));
        using var response = await client.SendAsync(request, cancellationToken);
        if (allowNoContent && response.StatusCode == System.Net.HttpStatusCode.NoContent) return null;
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }

    private async Task<string> GetSpotifyUserAsync(string accessToken, CancellationToken cancellationToken)
    {
        using var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.spotify.com/v1/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        using var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return json.RootElement.GetProperty("id").GetString()!;
    }
}
