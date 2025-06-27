using System.Text.Json.Serialization;

namespace AuraLogbook.Api.Models
{
    // Represents the per-sign section in the JSON
    public class ZodiacSignInsights
    {
         /// The zodiac sign key (e.g., "aries", "taurus"). 
        [JsonPropertyName("sign")] 
        public string Sign { get; set; } = default!;

        [JsonPropertyName("description")]
        public string Description { get; set; } = default!;

        [JsonPropertyName("element")]
        public string Element { get; set; } = default!;

        [JsonPropertyName("insights")]
        public List<InsightTemplate> Insights { get; set; } = new();
    }

    // Represents each insight entry under "insights"
    public class InsightTemplate
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = default!;

        [JsonPropertyName("title")]
        public string Title { get; set; } = default!;

        [JsonPropertyName("message")]
        public string Message { get; set; } = default!;
    }
}
