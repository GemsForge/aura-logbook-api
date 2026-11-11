using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    /// <summary>
    /// New-account request. Standalone rather than derived from <see cref="AuthRequest"/> so the
    /// stricter <see cref="PasswordRules"/> apply here without changing login validation.
    /// </summary>
    /// <remarks>
    /// Since #341 registration is short: email, password and display name. Birthday and pathway
    /// are optional here and are normally supplied through onboarding. Aura color and intensity
    /// are no longer accepted as input; the aura is derived, not chosen.
    /// </remarks>
    public class RegisterUserRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = default!;

        /// <summary>Plain-text password; must satisfy <see cref="PasswordRules"/>.</summary>
        [Required]
        [StringLength(PasswordRules.MaxLength, MinimumLength = PasswordRules.MinLength, ErrorMessage = PasswordRules.LengthMessage)]
        public string Password { get; set; } = default!;

        [MaxLength(30, ErrorMessage = "Display name cannot exceed 30 characters.")]
        public string? DisplayName { get; set; }
        /// <summary>Optional; when present the zodiac sign is derived from it.</summary>
        public DateOnly? Birthday { get; set; }

        /// <summary>Optional stable pathway key; omitted values default to mindfulness.</summary>
        public string? SelectedPathway { get; set; }
    }
}
