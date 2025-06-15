using AuraLogbook.Api.Models.Enums;
using System.Text.Json.Serialization;

namespace AuraLogbook.Api.Models;
public class MoodEntry
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime Date { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public List<MoodType> Moods { get; set; } = new();

    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
