namespace AuraLogbook.Api.Models;

/// <summary>Encrypted-at-rest Spotify credentials stored for one Aura user.</summary>
public sealed class SpotifyConnectionRecord
{
    public int UserId { get; set; }
    public string SpotifyUserId { get; set; } = "";
    public string EncryptedAccessToken { get; set; } = "";
    public string EncryptedRefreshToken { get; set; } = "";
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
