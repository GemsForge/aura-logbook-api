namespace AuraLogbook.Api.Models;

public sealed class ReflectionResponse
{
    public int Id { get; set; }
    public int PromptId { get; set; }
    public int MoodEntryId { get; set; }
    public string ResponseText { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
