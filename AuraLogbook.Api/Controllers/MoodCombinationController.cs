using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.ReferenceData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>Serves authored mood-combination interpretations for the signed-in user's selected pathway.</summary>
[ApiController]
[Authorize]
[Route("api/mood-combinations")]
public sealed class MoodCombinationController(IMoodCombinationRepository repository, IReferenceDataValidator referenceData) : ControllerBase
{
    /// <summary>Looks up an interpretation for two or three selected moods and a pathway.</summary>
    /// <param name="moods">Comma-separated mood names; order does not affect matching.</param>
    /// <param name="pathwayKey">The persisted spiritual pathway key.</param>
    [HttpGet("interpretation")]
    public async Task<IActionResult> GetInterpretation([FromQuery] string? moods, [FromQuery] int pathwayKey)
    {
        if (!Enum.IsDefined(typeof(SpiritualPathway), pathwayKey))
            return BadRequest("Unknown pathway key.");
        if (string.IsNullOrWhiteSpace(moods))
            return BadRequest("Select two or three moods.");

        var selected = new List<string>();
        foreach (var value in moods.Split(',', StringSplitOptions.TrimEntries))
        {
            if (string.IsNullOrWhiteSpace(value))
                return BadRequest("One or more selected moods are unknown.");
            selected.Add(value);
        }
        if (selected.Count is < 2 or > 3 || selected.Distinct().Count() != selected.Count)
            return BadRequest("Select two or three distinct moods.");
        if (!await referenceData.AreActiveMoodsAsync(selected))
            return BadRequest("One or more selected moods are unknown.");

        var result = await repository.GetAsync(selected, pathwayKey);
        return result is null ? NoContent() : Ok(result);
    }
}
