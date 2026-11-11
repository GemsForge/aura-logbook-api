namespace AuraLogbook.Api.Models;

/// <summary>
/// Persisted password reset token. <see cref="TokenHash"/> is the hex SHA-256 of the raw token;
/// the raw token exists only in the emailed link and is never stored.
/// </summary>
public sealed class PasswordResetToken
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    /// <summary>Set when the token is consumed or superseded; non-null tokens can never be used.</summary>
    public DateTime? UsedAt { get; set; }
}
