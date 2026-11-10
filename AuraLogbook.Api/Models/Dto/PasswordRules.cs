namespace AuraLogbook.Api.Models.Dto;

/// <summary>
/// Server-side password length rules for creating or changing a password.
/// </summary>
/// <remarks>
/// Matches the UI's RegisterSchema (8–72). The 72 ceiling is bcrypt's input limit; longer input
/// would be silently truncated. Login deliberately does NOT use these rules so accounts created
/// under the older 6-character minimum can still sign in.
/// </remarks>
public static class PasswordRules
{
    /// <summary>Minimum length for a new password.</summary>
    public const int MinLength = 8;

    /// <summary>Maximum length for a new password (bcrypt input limit).</summary>
    public const int MaxLength = 72;

    /// <summary>Validation message shared by registration and password updates.</summary>
    public const string LengthMessage = "Password must be between 8 and 72 characters long.";
}
