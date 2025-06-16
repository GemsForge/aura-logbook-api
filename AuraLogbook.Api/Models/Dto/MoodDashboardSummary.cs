using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Models.Dto
{
    public class MoodDashboardSummary
    {
        public int TotalEntries { get; set; }
        public MoodType? MostFrequentMood { get; set; }
        public int CurrentStreak { get; set; }
        public DateOnly? LastEntryDate { get; set; }
    }

}
