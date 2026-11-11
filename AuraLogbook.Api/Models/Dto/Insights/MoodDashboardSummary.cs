namespace AuraLogbook.Api.Models.Dto.Insights
{
    public class MoodDashboardSummary
    {
        public int TotalEntries { get; set; }
        /// <summary>Gets or sets the key of the most frequently recorded mood.</summary>
        public string? MostFrequentMood { get; set; }
        public int CurrentStreak { get; set; }
        public DateOnly? LastEntryDate { get; set; }
    }

}
