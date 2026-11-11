namespace AuraLogbook.Api.Models;
public class MoodEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    /// <summary>Gets or sets database-defined mood keys recorded for this entry.</summary>
    public List<string> Moods { get; set; } = new();
    public string? Comment { get; set; }
    public string? AuraColor { get; set; }
    public int? AuraIntensity { get; set; }
    public string? ChakraKey { get; set; }
    public string? WeatherSnapshot { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
