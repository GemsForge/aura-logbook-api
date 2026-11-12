using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.ReferenceData;
using AuraLogbook.Api.Services.Mood;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>Serves pathway-aware reflections for the signed-in user's selected mood set.</summary>
[ApiController]
[Authorize]
[Route("api/mood-combinations")]
public sealed class MoodCombinationController(IMoodCombinationRepository repository, IReferenceDataValidator referenceData) : ControllerBase
{
    /// <summary>Returns a curated reflection when available, otherwise composing one for any valid two- or three-mood set.</summary>
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
        if (selected.Count is < 2 or > 3 || selected.Distinct(StringComparer.OrdinalIgnoreCase).Count() != selected.Count)
            return BadRequest("Select two or three distinct moods.");
        // Resolve case-insensitively to canonical keys, matching the former enum parse behavior.
        var canonical = await referenceData.ResolveActiveMoodKeysAsync(selected);
        if (canonical is null)
            return BadRequest("One or more selected moods are unknown.");

        var result = await repository.GetAsync(canonical, pathwayKey)
            ?? MoodCombinationReflectionComposer.Compose(canonical, pathwayKey);
        return Ok(result);
    }
}
