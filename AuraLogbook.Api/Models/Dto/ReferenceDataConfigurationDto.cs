namespace AuraLogbook.Api.Models.Dto;

/// <summary>Contains the active, versioned definitions and visual configuration consumed by clients.</summary>
public sealed class ReferenceDataConfigurationDto
{
    public required IReadOnlyList<ReferenceDataDefinitionDto> Pathways { get; init; }
    public required IReadOnlyList<AuraColorConfigurationDto> Auras { get; init; }
    public required IReadOnlyList<ReferenceDataDefinitionDto> Chakras { get; init; }
    public required IReadOnlyList<MoodDefinitionDto> Moods { get; init; }
    public required IReadOnlyList<ThemeTokenDto> ThemeTokens { get; init; }
    public required IReadOnlyList<GraphicAssetDto> Graphics { get; init; }
    public required IReadOnlyList<ZodiacSignDefinitionDto> ZodiacSigns { get; init; }
}

/// <summary>Describes a stable-key reference-data item.</summary>
public class ReferenceDataDefinitionDto
{
    public required string Key { get; init; }
    public required string DisplayName { get; init; }
    public required string Description { get; init; }
    public int SortOrder { get; init; }
}

/// <summary>Describes one aura color and its intensity palette.</summary>
public sealed class AuraColorConfigurationDto : ReferenceDataDefinitionDto
{
    public required string BaseHex { get; init; }
    public string? ChakraKey { get; init; }
    public bool IsNeutral { get; init; }
    public required IReadOnlyDictionary<int, string> Shades { get; init; }
}

/// <summary>Describes a mood and its persisted presentation metadata.</summary>
public sealed class MoodDefinitionDto : ReferenceDataDefinitionDto
{
    public required string Icon { get; init; }
    /// <summary>Activation from 1 (low) to 5 (high); positions the mood on the Insights aura ribbon. Not a good/bad score.</summary>
    public int EnergyLevel { get; init; } = 3;
    public required IReadOnlyList<string> AuraColorKeys { get; init; }
}

/// <summary>Describes a design token stored as data.</summary>
public sealed class ThemeTokenDto
{
    public required string Key { get; init; }
    public required string Value { get; init; }
    public required string Category { get; init; }
}

/// <summary>Describes a static graphic and its accessible metadata.</summary>
public sealed class GraphicAssetDto
{
    public required string Key { get; init; }
    public required string Path { get; init; }
    public required string DisplayName { get; init; }
    public required string AlternativeText { get; init; }
    public required string AssetType { get; init; }
}

/// <summary>Provides a data-driven zodiac symbol for client presentation.</summary>
public sealed class ZodiacSignDefinitionDto
{
    public required string Key { get; init; }
    public required string Description { get; init; }
    public required string Element { get; init; }
    public required string Symbol { get; init; }
}
