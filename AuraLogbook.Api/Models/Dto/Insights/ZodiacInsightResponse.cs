using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Models.Dto.Insights
{
    public class ZodiacInsightResponse
    {
        // Zodiac details
        public string Sign { get; set; } = default!;
        public string Description { get; set; } = default!;
        public string Element { get; set; } = default!;

        // Mood dashboard summary
        public int TotalEntries { get; set; }
        public MoodType? MostFrequentMood { get; set; }
        public int CurrentStreak { get; set; }
        public DateOnly? LastEntryDate { get; set; }

        // The list of triggered, sign-specific insights
        public List<InsightTemplate> Insights { get; set; } = new();
    }
}
