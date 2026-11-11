namespace AuraLogbook.Api.Models.Dto
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string DisplayName { get; set; }
        public string? ZodiacSign { get; set; }
        public required DateOnly Birthday { get; set; }
        public required string AuraColor { get; set; }
        /// <summary>Saved interface appearance, normalized to a supported theme.</summary>
        public required string InterfaceTheme { get; set; }
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
        public SpiritualPathway SelectedPathway { get; set; } = SpiritualPathway.Mindfulness;
    }
}
