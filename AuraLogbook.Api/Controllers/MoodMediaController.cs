using System.Security.Claims;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>Provides authenticated upload, listing, preview, and deletion for private mood images.</summary>
[Authorize]
[ApiController]
[Route("api/Mood/{moodEntryId:int}/attachments")]
public sealed class MoodMediaController : ControllerBase
{
    private const long MaximumRequestBytes = 11 * 1024 * 1024;
    private readonly IMoodMediaService _mediaService;

    /// <summary>Creates the controller with the owner-aware media service.</summary>
    public MoodMediaController(IMoodMediaService mediaService) => _mediaService = mediaService;

    /// <summary>Lists private images for a mood entry owned by the authenticated user.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<MoodMediaAttachmentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetForMood(int moodEntryId, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _mediaService.GetForMoodAsync(GetUserId(), moodEntryId, cancellationToken));
        }
        catch (MoodMediaException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Uploads one validated image, limited to 10 MB and 10 attachments per mood entry.</summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaximumRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaximumRequestBytes)]
    [ProducesResponseType(typeof(MoodMediaAttachmentDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Add(int moodEntryId, [FromForm] IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null)
            return BadRequest(new ProblemDetails { Title = "Choose an image file to attach." });

        try
        {
            var attachment = await _mediaService.AddAsync(GetUserId(), moodEntryId, file, cancellationToken);
            return CreatedAtAction(nameof(GetContent), new { moodEntryId, attachmentId = attachment.Id }, attachment);
        }
        catch (MoodMediaException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Streams an owned image without exposing a public URL or cacheable copy.</summary>
    [HttpGet("{attachmentId}/content")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetContent(int moodEntryId, string attachmentId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediaService.OpenAsync(GetUserId(), moodEntryId, attachmentId, cancellationToken);
            if (result is null)
                return NotFound();

            Response.Headers["Cache-Control"] = "private, no-store";
            Response.Headers["X-Content-Type-Options"] = "nosniff";
            return File(result.Value.Content, result.Value.Attachment.ContentType);
        }
        catch (MoodMediaException exception)
        {
            return ToProblem(exception);
        }
    }

    /// <summary>Deletes one image and its private file for an owned mood entry.</summary>
    [HttpDelete("{attachmentId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int moodEntryId, string attachmentId, CancellationToken cancellationToken)
    {
        try
        {
            return await _mediaService.DeleteAsync(GetUserId(), moodEntryId, attachmentId, cancellationToken)
                ? NoContent()
                : NotFound();
        }
        catch (MoodMediaException exception)
        {
            return ToProblem(exception);
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var userId)
            ? userId
            : throw new UnauthorizedAccessException("Invalid or missing user ID in token.");
    }

    private ObjectResult ToProblem(MoodMediaException exception)
    {
        var statusCode = exception.Failure switch
        {
            MoodMediaFailure.MoodNotFound or MoodMediaFailure.AttachmentNotFound => StatusCodes.Status404NotFound,
            MoodMediaFailure.FileTooLarge => StatusCodes.Status413PayloadTooLarge,
            MoodMediaFailure.AttachmentLimitReached => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status400BadRequest
        };
        return Problem(statusCode: statusCode, detail: exception.Message);
    }
}
