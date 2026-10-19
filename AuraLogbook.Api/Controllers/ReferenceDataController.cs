using AuraLogbook.Api.Data.Database;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

[ApiController]
[Route("api/reference-data")]
public sealed class ReferenceDataController(IDbConnectionFactory factory) : ControllerBase
{
    [HttpGet("auras")]
    public async Task<IActionResult> GetAuras()
    {
        using var connection = factory.CreateConnection();
        return Ok(await connection.QueryAsync("SELECT AuraColorKey AS Key, DisplayName, BaseHex, ChakraKey, Description, IsNeutral, IsActive FROM AuraColorDefinitions WHERE IsActive = 1 ORDER BY AuraColorKey"));
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
}
