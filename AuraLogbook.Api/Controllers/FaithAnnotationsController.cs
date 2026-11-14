using System.Security.Claims;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.Faith;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

/// <summary>Authenticated CRUD endpoints for private reader annotations and bookmarks.</summary>
[Authorize]
[ApiController]
[Route("api/faith/annotations")]
public sealed class FaithAnnotationsController(ISacredTextAnnotationRepository repository) : ControllerBase
{
    /// <summary>Lists only the signed-in user's annotations for one selected framework.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] string? framework, [FromQuery] string? sectionReference)
    {
        var normalized = FaithFrameworks.Normalize(framework);
        if (normalized is null) return BadRequest("Choose a supported sacred-text framework.");
        if (sectionReference?.Length > 120) return BadRequest("The section reference is too long.");
        return Ok(await repository.GetByUserAsync(GetUserId(), normalized, sectionReference));
    }

    /// <summary>Creates a private highlight, note, or bookmark without storing quoted source text.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SacredTextAnnotationRequest request)
    {
        var validation = Validate(request);
        if (validation is not null) return BadRequest(validation);
        var now = DateTime.UtcNow;
        var annotation = Map(GetUserId(), request, now, now);
        annotation.Id = await repository.CreateAsync(annotation);
        return CreatedAtAction(nameof(GetMine), new { framework = annotation.Framework, sectionReference = annotation.SectionReference }, annotation);
    }

    /// <summary>Updates a private annotation only when its ID belongs to the signed-in user.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SacredTextAnnotationRequest request)
    {
        var validation = Validate(request);
        if (validation is not null) return BadRequest(validation);
        var ownerId = GetUserId();
        var existing = await repository.GetByIdAsync(ownerId, id);
        if (existing is null) return NotFound("Reader annotation not found.");
        var updated = Map(ownerId, request, existing.CreatedAt, DateTime.UtcNow);
        updated.Id = id;
        return await repository.UpdateAsync(updated) ? NoContent() : NotFound("Reader annotation not found.");
    }

    /// <summary>Deletes an annotation only when its ID belongs to the signed-in user.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id) => await repository.DeleteAsync(GetUserId(), id)
        ? NoContent()
        : NotFound("Reader annotation not found.");

    /// <summary>Checks supported keys, offset bounds, and note content before persistence.</summary>
    private static string? Validate(SacredTextAnnotationRequest request)
    {
        if (FaithFrameworks.Normalize(request.Framework) is null)
            return "Choose a supported sacred-text framework.";
        if (string.IsNullOrWhiteSpace(request.SectionReference) || string.IsNullOrWhiteSpace(request.SourceVersion)
            || string.IsNullOrWhiteSpace(request.Language))
            return "Provide the source section, version, and language.";
        if (request.Kind is not ("highlight" or "note" or "bookmark"))
            return "Choose a highlight, note, or bookmark.";
        if (request.EndOffset < request.StartOffset || ((request.Kind is "highlight" or "note") && request.EndOffset == request.StartOffset))
            return "Provide a valid text range.";
        if (request.Kind == "note" && string.IsNullOrWhiteSpace(request.Note))
            return "Write a note before saving it.";
        if (request.Kind != "note" && !string.IsNullOrWhiteSpace(request.Note))
            return "Only a note annotation can contain note text.";
        return null;
    }

    /// <summary>Maps validated input to a detached, authenticated-owner record.</summary>
    private static SacredTextAnnotation Map(int userId, SacredTextAnnotationRequest request, DateTime createdAt, DateTime updatedAt) => new()
    {
        UserId = userId,
        Framework = FaithFrameworks.Normalize(request.Framework)!,
        SectionReference = request.SectionReference.Trim(),
        SourceVersion = request.SourceVersion.Trim(),
        Language = request.Language.Trim(),
        Kind = request.Kind,
        StartOffset = request.StartOffset,
        EndOffset = request.EndOffset,
        SegmentReference = string.IsNullOrWhiteSpace(request.SegmentReference) ? null : request.SegmentReference.Trim(),
        Note = request.Kind == "note" ? request.Note!.Trim() : null,
        CreatedAt = createdAt,
        UpdatedAt = updatedAt
    };

    /// <summary>Reads the account ID from the validated bearer token.</summary>
    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id)
            ? id
            : throw new UnauthorizedAccessException("Invalid or missing user ID in token.");
    }
}
