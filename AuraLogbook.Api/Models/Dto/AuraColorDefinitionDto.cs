namespace AuraLogbook.Api.Models.Dto;

public sealed class AuraColorDefinitionDto
{
    public required string Key { get; set; }
    public required string DisplayName { get; set; }
    public required string BaseHex { get; set; }
    public string? ChakraKey { get; set; }
    public required string Description { get; set; }
    public bool IsNeutral { get; set; }
    public bool IsActive { get; set; }
}
