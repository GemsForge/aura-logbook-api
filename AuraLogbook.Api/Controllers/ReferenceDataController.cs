using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models.Dto;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

[ApiController]
[Route("api/reference-data")]
public sealed class ReferenceDataController(IDbConnectionFactory factory) : ControllerBase
{
    /// <summary>Returns the active, database-backed definitions and visual tokens used by the UI.</summary>
    [HttpGet]
    public async Task<ActionResult<ReferenceDataConfigurationDto>> GetConfiguration()
    {
        using var connection = factory.CreateConnection();
        var pathways = (await connection.QueryAsync<ReferenceDataDefinitionDto>(
            "SELECT StableKey AS Key, DisplayName, Description, SortOrder FROM SpiritualPathways WHERE IsActive = 1 ORDER BY SortOrder, StableKey")).ToList();
        var chakras = (await connection.QueryAsync<ReferenceDataDefinitionDto>(
            "SELECT ChakraKey AS Key, DisplayName, Description, SortOrder FROM ChakraDefinitions WHERE IsActive = 1 ORDER BY SortOrder, ChakraKey")).ToList();
        var auraRows = (await connection.QueryAsync<AuraColorRow>(
            "SELECT AuraColorKey AS Key, DisplayName, BaseHex, ChakraKey, Description, IsNeutral, SortOrder FROM AuraColorDefinitions WHERE IsActive = 1 ORDER BY SortOrder, AuraColorKey")).ToList();
        var shadeRows = await connection.QueryAsync<ShadeRow>(
            "SELECT AuraColorKey AS Key, Shade, HexValue FROM AuraColorShades ORDER BY AuraColorKey, Shade");
        var shadesByColor = shadeRows.GroupBy(row => row.Key)
            .ToDictionary(group => group.Key, group => (IReadOnlyDictionary<int, string>)group.ToDictionary(row => row.Shade, row => row.HexValue));
        var auras = auraRows.Select(row => new AuraColorConfigurationDto
        {
            Key = row.Key,
            DisplayName = row.DisplayName,
            BaseHex = row.BaseHex,
            ChakraKey = row.ChakraKey,
            Description = row.Description,
            IsNeutral = row.IsNeutral,
            SortOrder = row.SortOrder,
            Shades = shadesByColor.GetValueOrDefault(row.Key) ?? new Dictionary<int, string>()
        }).ToList();
        var moodRows = (await connection.QueryAsync<MoodRow>(
            "SELECT MoodKey AS Key, DisplayName, Description, Icon, SortOrder, EnergyLevel FROM MoodDefinitions WHERE IsActive = 1 ORDER BY SortOrder, MoodKey")).ToList();
        var moodMappings = await connection.QueryAsync<MoodAuraMappingRow>(
            "SELECT mapping.MoodKey, mapping.AuraColorKey FROM MoodAuraMappings mapping " +
            "INNER JOIN MoodDefinitions mood ON mood.MoodKey = mapping.MoodKey AND mood.IsActive = 1 " +
            "INNER JOIN AuraColorDefinitions aura ON aura.AuraColorKey = mapping.AuraColorKey AND aura.IsActive = 1 " +
            "ORDER BY mapping.MoodKey, mapping.AuraColorKey");
        var mappingsByMood = moodMappings.GroupBy(row => row.MoodKey)
            .ToDictionary(group => group.Key, group => (IReadOnlyList<string>)group.Select(row => row.AuraColorKey).ToList());
        var moods = moodRows.Select(row => new MoodDefinitionDto
        {
            Key = row.Key,
            DisplayName = row.DisplayName,
            Description = row.Description,
            Icon = row.Icon,
            SortOrder = row.SortOrder,
            EnergyLevel = row.EnergyLevel,
            AuraColorKeys = mappingsByMood.GetValueOrDefault(row.Key) ?? Array.Empty<string>()
        }).ToList();
        var tokens = (await connection.QueryAsync<ThemeTokenDto>(
            "SELECT TokenKey AS Key, TokenValue AS Value, Category FROM ThemeTokens WHERE IsActive = 1 ORDER BY Category, SortOrder, TokenKey")).ToList();
        var graphics = (await connection.QueryAsync<GraphicAssetDto>(
            "SELECT AssetKey AS Key, AssetPath AS Path, DisplayName, AlternativeText, AssetType FROM GraphicAssets WHERE IsActive = 1 ORDER BY AssetKey")).ToList();
        var zodiacSigns = (await connection.QueryAsync<ZodiacSignDefinitionDto>(
            "SELECT SignKey AS Key, Description, Element, Symbol FROM ZodiacSigns WHERE Symbol <> '' ORDER BY SignKey")).ToList();

        return Ok(new ReferenceDataConfigurationDto
        {
            Pathways = pathways,
            Auras = auras,
            Chakras = chakras,
            Moods = moods,
            ThemeTokens = tokens,
            Graphics = graphics,
            ZodiacSigns = zodiacSigns
        });
    }

    [HttpGet("auras")]
    public async Task<IActionResult> GetAuras()
    {
        using var connection = factory.CreateConnection();
        return Ok(await connection.QueryAsync<AuraColorDefinitionDto>(
            "SELECT AuraColorKey AS Key, DisplayName, BaseHex, ChakraKey, Description, IsNeutral, IsActive FROM AuraColorDefinitions WHERE IsActive = 1 ORDER BY AuraColorKey"));
    }

    [HttpGet("chakras")]
    public async Task<IActionResult> GetChakras()
    {
        using var connection = factory.CreateConnection();
        return Ok(await connection.QueryAsync("SELECT ChakraKey AS Key, DisplayName, Description FROM ChakraDefinitions ORDER BY ChakraKey"));
    }

    [HttpGet("pathways")]
    public async Task<IActionResult> GetPathways()
    {
        using var connection = factory.CreateConnection();
        return Ok(await connection.QueryAsync("SELECT PathwayKey AS Key, DisplayName, Description FROM SpiritualPathways ORDER BY PathwayKey"));
    }

    [HttpGet("mood-aura-mappings")]
    public async Task<IActionResult> GetMoodAuraMappings()
    {
        using var connection = factory.CreateConnection();
        return Ok(await connection.QueryAsync("SELECT MoodKey, AuraColorKey FROM MoodAuraMappings ORDER BY MoodKey, AuraColorKey"));
    }

    private sealed class AuraColorRow
    {
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string BaseHex { get; set; } = string.Empty;
        public string? ChakraKey { get; set; }
        public string Description { get; set; } = string.Empty;
        public bool IsNeutral { get; set; }
        public int SortOrder { get; set; }
    }

    private sealed class ShadeRow
    {
        public string Key { get; set; } = string.Empty;
        public int Shade { get; set; }
        public string HexValue { get; set; } = string.Empty;
    }

    private sealed class MoodRow
    {
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public int SortOrder { get; set; }
        public int EnergyLevel { get; set; } = 3;
    }

    private sealed class MoodAuraMappingRow
    {
        public string MoodKey { get; set; } = string.Empty;
        public string AuraColorKey { get; set; } = string.Empty;
    }
}
