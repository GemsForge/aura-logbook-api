namespace AuraLogbook.Api.Models;

/// <summary>Public Spotify metadata; provider credentials never appear in these contracts.</summary>
public sealed record SpotifyConnectionStatus(bool Configured, bool Connected);
public sealed record SpotifyPlaylist(string Id, string Name, string? ImageUrl, string? SpotifyUrl);
public sealed record SpotifyPlaylistPage(IReadOnlyList<SpotifyPlaylist> Items, bool HasMore);
public sealed record SpotifyPlayback(string Name, string Artists, string? ImageUrl, string? SpotifyUrl, bool IsPlaying);

/// <summary>Pending single-use OAuth attempt with encrypted PKCE material.</summary>
public sealed class SpotifyAuthorizationAttempt
{
    public string StateHash { get; set; } = "";
    public int UserId { get; set; }
    public string EncryptedVerifier { get; set; } = "";
    public string RedirectUri { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
}
