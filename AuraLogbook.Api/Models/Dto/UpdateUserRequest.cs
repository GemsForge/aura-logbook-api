using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    public class UpdateUserRequest
    {
        [Required]
        public int Id { get; set; }

        [EmailAddress]
        public string Email { get; set; } = default!;

        /// <summary>Optional new password; when present it must satisfy <see cref="PasswordRules"/>.</summary>
        [StringLength(PasswordRules.MaxLength, MinimumLength = PasswordRules.MinLength, ErrorMessage = PasswordRules.LengthMessage)]
        public string? Password { get; set; }

        [MaxLength(30)]
        public string? DisplayName { get; set; }

        public DateOnly Birthday { get; set; }

        public string? AuraColor { get; set; }
        [Range(0, 100)]
        public int? AuraIntensity { get; set; }

        public string? Avatar { get; set; }
        public string? Motto { get; set; }
        [Required]
        public SpiritualPathway SelectedPathway { get; set; } = SpiritualPathway.Mindfulness;
}
}
