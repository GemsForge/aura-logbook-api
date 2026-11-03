using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AuraLogbook.Api.Configuration;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.Spotify;

/// <summary>Owns OAuth, encrypted credentials and metadata; no provider tokens leave the API.</summary>
public sealed class SpotifyService : ISpotifyService
{
    private static readonly ConcurrentDictionary<int, SemaphoreSlim> UserLocks = new();
    private readonly SpotifyOptions _options;
    private readonly ISpotifyConnectionRepository _repository;
    private readonly IHttpClientFactory _clients;
    private readonly IDataProtector _tokens;
    private readonly IDataProtector _verifiers;
    private bool Configured => !string.IsNullOrWhiteSpace(_options.ClientId) && !string.IsNullOrWhiteSpace(_options.ClientSecret);

    public SpotifyService(IOptions<SpotifyOptions> options, ISpotifyConnectionRepository repository, IHttpClientFactory clients, IDataProtectionProvider protection)
    {
        _options = options.Value;
        _repository = repository;
        _clients = clients;
        // Keep the token purpose stable so existing encrypted connections remain readable.
        _tokens = protection.CreateProtector("AuraLogbook.SpotifyTokens.v1");
        _verifiers = protection.CreateProtector("AuraLogbook.SpotifyPkce.v1");
    }

    /// <summary>Creates durable, single-use state and a PKCE challenge before redirecting.</summary>
    public async Task<string> CreateAuthorizationUrlAsync(int userId)
    {
        RequireConfiguration();
        var state = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var verifier = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));
        await _repository.SaveAttemptAsync(new SpotifyAuthorizationAttempt
        {
            StateHash = Hash(state), UserId = userId, EncryptedVerifier = _verifiers.Protect(verifier),
            RedirectUri = _options.RedirectUri, ExpiresAt = DateTime.UtcNow.AddMinutes(10)
        });
        return QueryHelpers.AddQueryString("https://accounts.spotify.com/authorize", new Dictionary<string, string?>
        {
            ["client_id"] = _options.ClientId, ["response_type"] = "code",
            ["redirect_uri"] = _options.RedirectUri, ["state"] = state,
            ["scope"] = "user-read-currently-playing playlist-read-private playlist-read-collaborative",
            ["code_challenge_method"] = "S256", ["code_challenge"] = Hash(verifier)
        });
    }

    /// <summary>Consumes state before exchanging a one-use code, preserving the original redirect URI.</summary>
    public async Task CompleteAuthorizationAsync(string state, string code, CancellationToken cancellationToken)
    {
        RequireConfiguration();
        var attempt = await _repository.ConsumeAttemptAsync(Hash(state));
        if (attempt is null || attempt.ExpiresAt <= DateTime.UtcNow)
            throw new SpotifyIntegrationException("state-error", "Your Spotify sign-in expired. Connect again.", 400);
        var token = await TokenRequestAsync(new()
        {
            ["grant_type"] = "authorization_code", ["code"] = code,
            ["redirect_uri"] = attempt.RedirectUri,
            ["code_verifier"] = _verifiers.Unprotect(attempt.EncryptedVerifier)
        }, cancellationToken);
        var access = Required(token, "access_token");
        var profile = await ReadAsync("me", access, cancellationToken);
        // New Spotify responses use account_id; older integrations can still return id.
        var accountId = Text(profile, "account_id") ?? Text(profile, "id")
            ?? throw new SpotifyIntegrationException("provider-error", "Spotify returned an incomplete profile.");
        var now = DateTime.UtcNow;
        var gate = UserLocks.GetOrAdd(attempt.UserId, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            await _repository.SaveAsync(new SpotifyConnectionRecord
            {
                UserId = attempt.UserId, SpotifyUserId = accountId,
                EncryptedAccessToken = _tokens.Protect(access),
                EncryptedRefreshToken = _tokens.Protect(Required(token, "refresh_token")),
                ExpiresAt = now.AddSeconds(token.GetProperty("expires_in").GetInt32()),
                CreatedAt = now, UpdatedAt = now
            });
        }
        finally { gate.Release(); }
    }

    public async Task<SpotifyConnectionStatus> GetConnectionAsync(int userId) =>
        new(Configured, await _repository.GetAsync(userId) is not null);

    public async Task DisconnectAsync(int userId)
    {
        var gate = UserLocks.GetOrAdd(userId, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync();
        try { await _repository.DeleteAsync(userId); }
        finally { gate.Release(); }
    }

    /// <summary>Uses the endpoint matching the currently-playing permission, with null for no playback.</summary>
    public async Task<SpotifyPlayback?> GetCurrentlyPlayingAsync(int userId, CancellationToken cancellationToken)
    {
        var root = await MetadataAsync(userId, "me/player/currently-playing", cancellationToken);
        if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("item", out var item) || item.ValueKind != JsonValueKind.Object) return null;
        var artists = item.TryGetProperty("artists", out var list) && list.ValueKind == JsonValueKind.Array
            ? string.Join(", ", list.EnumerateArray().Select(x => Text(x, "name")).Where(x => x is not null))
            : Text(item, "publisher") ?? "";
        var art = item.TryGetProperty("album", out var album) ? Image(album) : Image(item);
        return new(Required(item, "name"), artists, art, SpotifyUrl(item),
            root.TryGetProperty("is_playing", out var playing) && playing.ValueKind == JsonValueKind.True);
    }

    /// <summary>Returns the first fifty playlists and indicates whether Spotify has more results.</summary>
    public async Task<SpotifyPlaylistPage> GetPlaylistsAsync(int userId, CancellationToken cancellationToken)
    {
        var root = await MetadataAsync(userId, "me/playlists?limit=50", cancellationToken);
        if (!root.TryGetProperty("items", out var items) || items.ValueKind != JsonValueKind.Array)
            throw new SpotifyIntegrationException("provider-error", "Spotify returned an incomplete playlist list.");
        var result = items.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.Object && Text(x, "id") is not null)
            .Select(x => new SpotifyPlaylist(Required(x, "id"), Text(x, "name") ?? "Untitled playlist", Image(x), SpotifyUrl(x))).ToArray();
        return new(result, Text(root, "next") is not null);
    }

    // Serialize refreshes per user so simultaneous playlist/playback requests cannot overwrite rotated tokens.
    private async Task<JsonElement> MetadataAsync(int userId, string path, CancellationToken cancellationToken)
    {
        RequireConfiguration();
        var gate = UserLocks.GetOrAdd(userId, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            var record = await _repository.GetAsync(userId)
                ?? throw new SpotifyIntegrationException("reconnect-required", "Connect Spotify to continue.", 409);
            if (record.ExpiresAt <= DateTime.UtcNow.AddSeconds(60)) await RefreshAsync(record, cancellationToken);
            try { return await ReadAsync(path, _tokens.Unprotect(record.EncryptedAccessToken), cancellationToken); }
            catch (SpotifyIntegrationException exception) when (exception.Code == "reconnect-required")
            {
                await RefreshAsync(record, cancellationToken);
                return await ReadAsync(path, _tokens.Unprotect(record.EncryptedAccessToken), cancellationToken);
            }
        }
        catch (CryptographicException)
        {
            throw new SpotifyIntegrationException("reconnect-required", "Please reconnect Spotify.", 409);
        }
        finally { gate.Release(); }
    }

    private async Task RefreshAsync(SpotifyConnectionRecord record, CancellationToken cancellationToken)
    {
        var token = await TokenRequestAsync(new()
        {
            ["grant_type"] = "refresh_token", ["refresh_token"] = _tokens.Unprotect(record.EncryptedRefreshToken)
        }, cancellationToken);
        record.EncryptedAccessToken = _tokens.Protect(Required(token, "access_token"));
        var replacement = Text(token, "refresh_token");
        if (!string.IsNullOrEmpty(replacement)) record.EncryptedRefreshToken = _tokens.Protect(replacement);
        record.ExpiresAt = DateTime.UtcNow.AddSeconds(token.GetProperty("expires_in").GetInt32());
        record.UpdatedAt = DateTime.UtcNow;
        await _repository.SaveAsync(record);
    }

    private async Task<JsonElement> TokenRequestAsync(Dictionary<string, string> values, CancellationToken cancellationToken)
    {
        using var client = _clients.CreateClient("Spotify");
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://accounts.spotify.com/api/token");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}")));
        request.Content = new FormUrlEncodedContent(values);
        using var response = await client.SendAsync(request, cancellationToken);
        await CheckAsync(response);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return document.RootElement.Clone();
    }

    private async Task<JsonElement> ReadAsync(string path, string access, CancellationToken cancellationToken)
    {
        using var client = _clients.CreateClient("Spotify");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"{_options.ApiBaseUrl.TrimEnd('/')}/{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", access);
        using var response = await client.SendAsync(request, cancellationToken);
        if (response.StatusCode == HttpStatusCode.NoContent) return default;
        await CheckAsync(response);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        return document.RootElement.Clone();
    }

    private static Task CheckAsync(HttpResponseMessage response)
    {
        if (response.IsSuccessStatusCode) return Task.CompletedTask;
        throw response.StatusCode switch
        {
            HttpStatusCode.Unauthorized or HttpStatusCode.BadRequest => new SpotifyIntegrationException("reconnect-required", "Spotify sign-in needs to be renewed.", 409),
            HttpStatusCode.Forbidden => new SpotifyIntegrationException("access-denied", "Spotify denied access. Reconnect to review permissions and account access.", 403),
            HttpStatusCode.TooManyRequests => new SpotifyIntegrationException("rate-limited", "Spotify is busy. Wait a moment before retrying.", 429),
            _ => new SpotifyIntegrationException("unavailable", "Spotify is temporarily unavailable. Please retry.", 502)
        };
    }

    private void RequireConfiguration()
    {
        if (!Configured || !Uri.TryCreate(_options.RedirectUri, UriKind.Absolute, out var uri)
            || !(uri.Scheme == "https" || (uri.Scheme == "http" && (uri.Host == "127.0.0.1" || uri.Host == "[::1]"))))
            throw new SpotifyIntegrationException("not-configured", "Spotify is not available yet.", 503);
    }

    private static string Hash(string value) => WebEncoders.Base64UrlEncode(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
    private static string? Text(JsonElement element, string key) => element.ValueKind == JsonValueKind.Object
        && element.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    private static string Required(JsonElement element, string key) => Text(element, key)
        ?? throw new SpotifyIntegrationException("provider-error", "Spotify returned an incomplete response.");
    private static string? Image(JsonElement element) => element.ValueKind == JsonValueKind.Object
        && element.TryGetProperty("images", out var images) && images.ValueKind == JsonValueKind.Array
        ? images.EnumerateArray().Select(x => Text(x, "url")).FirstOrDefault(x => x is not null) : null;
    private static string? SpotifyUrl(JsonElement element) => element.TryGetProperty("external_urls", out var urls) ? Text(urls, "spotify") : null;
}
