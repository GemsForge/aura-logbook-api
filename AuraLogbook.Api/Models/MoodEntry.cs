using AuraLogbook.Api.Models.Enums;

namespace AuraLogbook.Api.Models;
public class MoodEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly Date { get; set; }
    public List<MoodType> Moods { get; set; } = new();
    public string? Comment { get; set; }
    public string? AuraColor { get; set; }
    public int? AuraIntensity { get; set; }
    public string? ChakraKey { get; set; }
    public string? WeatherSnapshot { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
