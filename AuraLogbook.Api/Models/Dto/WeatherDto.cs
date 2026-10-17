using System.Text.Json.Serialization;

namespace AuraLogbookApi.Dtos
{
    public class WeatherDto
    {
        /// <summary>
        /// Current temperature (°F).
        /// </summary>
        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }

        /// <summary>
        /// Text description of the weather (e.g. "Partly cloudy").
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; }

        /// <summary>
        /// Weather icon code compatible with the frontend's local icon set (e.g. "c02d").
        /// </summary>
        [JsonPropertyName("iconCode")]
        public string? IconCode { get; set; }
    }
}
