using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>Validated input for a private, source-version-bound reader annotation.</summary>
public sealed class SacredTextAnnotationRequest
{
    /// <summary>Profile-selected tradition to which the text belongs.</summary>
    [Required, StringLength(16)]
    public string Framework { get; set; } = "";

    /// <summary>Section identifier returned by the selected provider.</summary>
    [Required, StringLength(120)]
    public string SectionReference { get; set; } = "";

    /// <summary>Translation/version identifier returned with the section.</summary>
    [Required, StringLength(180)]
    public string SourceVersion { get; set; } = "";

    /// <summary>Language of the annotated text block, such as en or ar.</summary>
    [Required, StringLength(16, MinimumLength = 2)]
    public string Language { get; set; } = "";

    /// <summary>Whether this record is a highlight, note, or reading bookmark.</summary>
    [Required, StringLength(16)]
    public string Kind { get; set; } = "";

    /// <summary>Start character offset in the selected section.</summary>
    [Range(0, int.MaxValue)]
    public int StartOffset { get; set; }

    /// <summary>Exclusive end character offset in the selected section.</summary>
    [Range(0, int.MaxValue)]
    public int EndOffset { get; set; }

    /// <summary>Optional verse, ayah, or segment reference for non-drag actions.</summary>
    [StringLength(120)]
    public string? SegmentReference { get; set; }

    /// <summary>Optional user-authored private note; selected source text is not accepted.</summary>
    [StringLength(2000)]
    public string? Note { get; set; }
}
