using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>Body of <c>POST api/Auth/forgot-password</c>. Only an email is accepted.</summary>
public sealed class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    [MaxLength(254)]
    public string Email { get; set; } = default!;
}

/// <summary>Body of <c>POST api/Auth/reset-password</c>: the emailed token plus a new password.</summary>
public sealed class ResetPasswordRequest
{
    [Required]
    [MaxLength(128)]
    public string Token { get; set; } = default!;

    /// <summary>New plain-text password; must satisfy <see cref="PasswordRules"/>.</summary>
    [Required]
    [StringLength(PasswordRules.MaxLength, MinimumLength = PasswordRules.MinLength, ErrorMessage = PasswordRules.LengthMessage)]
    public string NewPassword { get; set; } = default!;
}
