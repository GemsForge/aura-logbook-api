using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

/// <summary>Storage for hashed, single-use password reset tokens.</summary>
public interface IPasswordResetTokenRepository
{
    /// <summary>
    /// Stores a new token and, in the same transaction, marks every earlier unused token for the
    /// user as used so only the most recently issued link works.
    /// </summary>
    Task IssueAsync(PasswordResetToken token);

    /// <summary>
    /// Atomically marks the token used if it exists, is unused, and has not expired at
    /// <paramref name="now"/>. Returns the owning user id, or null when the token is not redeemable.
    /// </summary>
    Task<int?> ConsumeAsync(string tokenHash, DateTime now);
}
