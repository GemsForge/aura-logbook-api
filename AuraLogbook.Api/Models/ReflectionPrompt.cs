namespace AuraLogbook.Api.Models;

public sealed class ReflectionPrompt
{
    public int Id { get; set; }
    public string PromptKey { get; set; } = string.Empty;
    public string PromptText { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int? PathwayKey { get; set; }
    public string? AuraColorKey { get; set; }
    public string? ChakraKey { get; set; }
}
