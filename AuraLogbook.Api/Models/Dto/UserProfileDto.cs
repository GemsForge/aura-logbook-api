namespace AuraLogbook.Api.Models.Dto
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string DisplayName { get; set; }
        public string? ZodiacSign { get; set; }
        /// <summary>Null when the user has not shared a birthday.</summary>
        public DateOnly? Birthday { get; set; }
        public required string AuraColor { get; set; }
        /// <summary>Saved interface appearance, normalized to a supported theme.</summary>
        public required string InterfaceTheme { get; set; }
        /// <summary>Normalized saved screen brightness, independent of interface family and aura color.</summary>
        public string InterfaceMode { get; set; } = "dark";
        /// <summary>Weather location mode: Off, City, or Device. Device coordinates are never returned or stored.</summary>
        public string WeatherLocationMode { get; set; } = WeatherLocationValues.Off;
        public string? WeatherCity { get; set; }
        public string? WeatherRegion { get; set; }
        public string? WeatherCountry { get; set; }
        /// <summary>"F" or "C".</summary>
        public string TemperatureUnit { get; set; } = WeatherLocationValues.Fahrenheit;
        public required int AuraIntensity { get; set; }
        public required string Avatar { get; set; }
        public required string Motto { get; set; }
        /// <summary>Stable key for the user's selected pathway.</summary>
        public string SelectedPathway { get; set; } = SpiritualPathwayKeys.Mindfulness;
        /// <summary>True once onboarding is completed or skipped; the UI routes to onboarding while false.</summary>
        public bool OnboardingCompleted { get; set; }
        /// <summary>Whether aura reveal copy and accents are shown.</summary>
        public bool AuraRevealsEnabled { get; set; } = true;
        /// <summary>Pathway-page choices from onboarding; null when none were made.</summary>
        public PathwayPreferences? PathwayPreferences { get; set; }
    }
}
