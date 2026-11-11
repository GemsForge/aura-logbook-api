using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    /// <summary>
    /// New-account request. Standalone rather than derived from <see cref="AuthRequest"/> so the
    /// stricter <see cref="PasswordRules"/> apply here without changing login validation.
    /// </summary>
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
        [Required(ErrorMessage = "Date is required.")]
        public DateOnly Birthday { get; set; } = DateOnly.MaxValue;
        // public byte[]? ProfilePictureBlob { get; set; }
        public string? AuraColor { get; set; }
        [Range(0, 100)]
        public int? AuraIntensity { get; set; }
        [Required]
        public SpiritualPathway SelectedPathway { get; set; } = SpiritualPathway.Mindfulness;
    }
}
