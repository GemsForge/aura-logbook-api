using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>Serves authored mood-combination interpretations for the signed-in user's selected pathway.</summary>
[ApiController]
[Authorize]
[Route("api/mood-combinations")]
public sealed class MoodCombinationController(IMoodCombinationRepository repository) : ControllerBase
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

        var selected = new List<MoodType>();
        foreach (var value in moods.Split(',', StringSplitOptions.TrimEntries))
        {
            if (!Enum.TryParse<MoodType>(value, ignoreCase: true, out var mood) || !Enum.IsDefined(mood))
                return BadRequest("One or more selected moods are unknown.");
            selected.Add(mood);
        }
        if (selected.Count is < 2 or > 3 || selected.Distinct().Count() != selected.Count)
            return BadRequest("Select two or three distinct moods.");

        var result = await repository.GetAsync(selected, pathwayKey);
        return result is null ? NoContent() : Ok(result);
    }
}
