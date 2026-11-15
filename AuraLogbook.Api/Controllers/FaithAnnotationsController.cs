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
        if (GetUserId() is not int userId) return Unauthorized();
        var normalized = FaithFrameworks.Normalize(framework);
        if (normalized is null) return BadRequest("Choose a supported sacred-text framework.");
        if (sectionReference?.Length > 120) return BadRequest("The section reference is too long.");
        return Ok(await repository.GetByUserAsync(userId, normalized, sectionReference));
    }

    /// <summary>Creates a private highlight, note, or bookmark without storing quoted source text.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SacredTextAnnotationRequest request)
    {
        if (GetUserId() is not int userId) return Unauthorized();
        var validation = Validate(request);
        if (validation is not null) return BadRequest(validation);
        var now = DateTime.UtcNow;
        var annotation = Map(userId, request, now, now);
        annotation.Id = await repository.CreateAsync(annotation);
        return CreatedAtAction(nameof(GetMine), new { framework = annotation.Framework, sectionReference = annotation.SectionReference }, annotation);
    }

    /// <summary>Updates a private annotation only when its ID belongs to the signed-in user.</summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SacredTextAnnotationUpdateRequest request)
    {
        if (GetUserId() is not int ownerId) return Unauthorized();
        var existing = await repository.GetByIdAsync(ownerId, id);
        if (existing is null) return NotFound("Reader annotation not found.");
        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        if (existing.Kind == "note" && note is null) return BadRequest("A private note cannot be empty.");
        if (existing.Kind != "note" && note is not null) return BadRequest("Only a note annotation can contain note text.");
        return await repository.UpdateAsync(ownerId, id, note, DateTime.UtcNow) ? NoContent() : NotFound("Reader annotation not found.");
    }

    /// <summary>Deletes an annotation only when its ID belongs to the signed-in user.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (GetUserId() is not int userId) return Unauthorized();
        return await repository.DeleteAsync(userId, id) ? NoContent() : NotFound("Reader annotation not found.");
    }

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
        if (request.Kind is "highlight" or "note")
        {
            if (string.IsNullOrWhiteSpace(request.SegmentReference))
                return "Choose a verse or segment reference for this annotation.";
            if (!SacredTextReferenceParser.SegmentBelongsToSection(request.SectionReference, request.SegmentReference))
                return "The selected segment must belong to the chosen section.";
            if (request.AnchorHash is null || !System.Text.RegularExpressions.Regex.IsMatch(request.AnchorHash, "^[a-f0-9]{64}$"))
                return "Provide a lowercase SHA-256 anchor hash for the selected text.";
        }
        else if (request.AnchorHash is not null)
            return "Only highlights and notes can have a text anchor hash.";
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
        AnchorHash = request.AnchorHash,
        Note = request.Kind == "note" ? request.Note!.Trim() : null,
        CreatedAt = createdAt,
        UpdatedAt = updatedAt
    };

    /// <summary>Reads the account ID from the validated bearer token.</summary>
    /// <summary>Returns the authenticated account ID or null when the bearer identity is missing or malformed.</summary>
    private int? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim is not null && int.TryParse(claim.Value, out var id)
            ? id
            : null;
    }
}
