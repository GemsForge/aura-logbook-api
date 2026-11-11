using System.Security.Cryptography;
using System.Text;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.Email;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services.PasswordReset;

/// <summary>Outcome of a reset attempt; deliberately coarse so callers cannot probe token state.</summary>
public enum PasswordResetResult { Success, InvalidOrExpiredToken, InvalidPassword }

/// <summary>Token-based account recovery (#329).</summary>
public interface IPasswordResetService
{
    /// <summary>
    /// Issues and emails a reset link when the account exists and the per-email limit allows.
    /// Always completes the same way so callers cannot learn whether the email is registered.
    /// </summary>
    Task RequestResetAsync(string email, CancellationToken cancellationToken = default);

    /// <summary>Redeems a raw token once and sets the new password.</summary>
    Task<PasswordResetResult> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default);
}

/// <inheritdoc />
public sealed class PasswordResetService : IPasswordResetService
{
    private readonly IFileUserRepository _users;
    private readonly IPasswordResetTokenRepository _tokens;
    private readonly IEmailSender _email;
    private readonly IMemoryCache _cache;
    private readonly PasswordResetOptions _options;
    private readonly TimeProvider _clock;
    private readonly ILogger<PasswordResetService> _logger;

    public PasswordResetService(IFileUserRepository users, IPasswordResetTokenRepository tokens, IEmailSender email,
        IMemoryCache cache, IOptions<PasswordResetOptions> options, TimeProvider clock, ILogger<PasswordResetService> logger)
    {
        _users = users; _tokens = tokens; _email = email; _cache = cache;
        _options = options.Value; _clock = clock; _logger = logger;
    }

    /// <summary>Hex SHA-256 of a raw token. Tokens are 256-bit random, so an unsalted fast hash is sufficient.</summary>
    public static string HashToken(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

    /// <inheritdoc />
    public async Task RequestResetAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = email.Trim();
        if (!TryConsumeEmailQuota(normalized))
        {
            _logger.LogWarning("Password reset request throttled for an email address");
            return;
        }

        var user = await _users.GetByEmailAsync(normalized);
        if (user is null)
            return; // Same observable outcome as a real account.

        var rawToken = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var now = _clock.GetUtcNow().UtcDateTime;
        await _tokens.IssueAsync(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = HashToken(rawToken),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(_options.TokenLifetimeMinutes),
        });

        var link = $"{_options.ResetUrlBase}?token={Uri.EscapeDataString(rawToken)}";
        await _email.SendAsync(user.Email, "Reset your Aura Logbook password",
            $"Use this link within {_options.TokenLifetimeMinutes} minutes to choose a new password:\n{link}\n\nIf you did not ask for this, you can ignore this email.",
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<PasswordResetResult> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default)
    {
        if (newPassword.Length is < PasswordRules.MinLength or > PasswordRules.MaxLength)
            return PasswordResetResult.InvalidPassword;
        if (string.IsNullOrWhiteSpace(token))
            return PasswordResetResult.InvalidOrExpiredToken;

        var userId = await _tokens.ConsumeAsync(HashToken(token.Trim()), _clock.GetUtcNow().UtcDateTime);
        if (userId is null)
            return PasswordResetResult.InvalidOrExpiredToken;

        var user = await _users.GetByIdAsync(userId.Value);
        if (user is null)
            return PasswordResetResult.InvalidOrExpiredToken;

        user.PasswordHash = PasswordHelper.HashPassword(newPassword);
        await _users.UpdateAsync(user);
        _logger.LogInformation("Password reset completed for user {UserId}", user.Id);
        return PasswordResetResult.Success;
    }

    /// <summary>Fixed-window counter per lower-cased email held in memory (single-instance API).</summary>
    private bool TryConsumeEmailQuota(string email)
    {
        var window = _cache.GetOrCreate("pwreset:" + email.ToLowerInvariant(), entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(_options.RateLimitWindowMinutes);
            return new QuotaWindow();
        })!;
        return Interlocked.Increment(ref window.Count) <= _options.MaxRequestsPerEmail;
    }

    private sealed class QuotaWindow { public int Count; }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
