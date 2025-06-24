using System.Text.Json.Serialization;

namespace AuraLogbookApi.Dtos
{
    public class WeatherDto
    {
        /// <summary>
        /// Current temperature (°C).
        /// </summary>
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        /// <summary>
        /// Text description of the weather (e.g. "Partly cloudy").
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Weatherbit icon code (e.g. "c02d") to build the icon URL.
        /// </summary>
        [JsonPropertyName("iconCode")]
        public string? IconCode { get; set; }
    }
}
