using AuraLogbook.Api.Services.Faith;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>
/// Faith &amp; Religion daily content (#392): a neutral Word of the Day that needs no framework, and a
/// sacred-text passage only for the one framework the client names. Provider keys never leave the server.
/// </summary>
[ApiController]
[Authorize]
[Route("api/faith")]
public sealed class FaithController(SacredTextService sacredText, TimeProvider time, ILogger<FaithController> logger) : ControllerBase
{
    private DateOnly Today => DateOnly.FromDateTime(time.GetUtcNow().UtcDateTime);

    /// <summary>Returns today's tradition-neutral word and reflection prompt.</summary>
    [HttpGet("word-of-day")]
    public ActionResult<WordOfDayDto> GetWordOfDay() => Ok(WordOfDayCatalog.For(Today));

    /// <summary>
    /// Returns today's passage for <paramref name="framework"/> (<c>christian</c>, <c>muslim</c>, or <c>jewish</c>).
    /// Responds 204 with no body when no supported framework is given or its provider is not configured,
    /// and 502 with no passage text when the provider fails, so the client never shows unrelated text.
    /// </summary>
    [HttpGet("passage")]
    public async Task<ActionResult<SacredPassageDto>> GetPassage([FromQuery] string? framework, CancellationToken cancellationToken)
    {
        try
        {
            var passage = await sacredText.GetDailyAsync(framework, Today, cancellationToken);
            return passage is null ? NoContent() : Ok(passage);
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning("Sacred-text provider for {Framework} failed with status {StatusCode}.",
                FaithFrameworks.Normalize(framework), ex.StatusCode);
            return StatusCode(StatusCodes.Status502BadGateway);
        }
    }
}
