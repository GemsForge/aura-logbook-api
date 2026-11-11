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

        /// <summary>Optional; omitted preserves the saved birthday (and its zodiac sign).</summary>
        public DateOnly? Birthday { get; set; }

        public string? AuraColor { get; set; }
        [Range(0, 100)]
        public int? AuraIntensity { get; set; }

        public string? Avatar { get; set; }
        public string? Motto { get; set; }
        /// <summary>Optional appearance preference; omitted values preserve the current theme.</summary>
        public string? InterfaceTheme { get; set; }
        /// <summary>Optional weather location mode (Off, City, Device); omitted preserves the current setting.</summary>
        public string? WeatherLocationMode { get; set; }
        /// <summary>City for City mode; required when the mode is City, ignored otherwise.</summary>
        [StringLength(100)]
        public string? WeatherCity { get; set; }
        /// <summary>Optional state or region for City mode.</summary>
        [StringLength(100)]
        public string? WeatherRegion { get; set; }
        /// <summary>Optional two-letter country code for City mode.</summary>
        [StringLength(2)]
        public string? WeatherCountry { get; set; }
        /// <summary>Optional aura reveals toggle (#344); omitted preserves the current setting.</summary>
        public bool? AuraRevealsEnabled { get; set; }
        /// <summary>Optional temperature unit, "F" or "C"; omitted preserves the current unit.</summary>
        public string? TemperatureUnit { get; set; }
        [Required]
        public SpiritualPathway SelectedPathway { get; set; } = SpiritualPathway.Mindfulness;
}
}
