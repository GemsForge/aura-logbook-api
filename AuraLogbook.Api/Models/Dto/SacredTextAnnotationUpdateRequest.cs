using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>Fields that may change after a private reader annotation has been anchored.</summary>
public sealed class SacredTextAnnotationUpdateRequest
{
    /// <summary>Replacement owner-authored note; required for notes and forbidden for highlights or bookmarks.</summary>
    [StringLength(2000)]
    public string? Note { get; set; }
}
