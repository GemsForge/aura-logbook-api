namespace AuraLogbook.Api.Models;

/// <summary>A private annotation anchored to one section and exact sacred-text source version.</summary>
public sealed class SacredTextAnnotation
{
    /// <summary>Database identifier returned to the owner.</summary>
    public int Id { get; set; }

    /// <summary>Authenticated user who owns the annotation.</summary>
    public int UserId { get; set; }

    /// <summary>The explicitly selected framework.</summary>
    public string Framework { get; set; } = "";

    /// <summary>Provider section identifier, such as a Bible chapter or Quran surah.</summary>
    public string SectionReference { get; set; } = "";

    /// <summary>Exact translation/version identity used to prevent anchors moving across editions.</summary>
    public string SourceVersion { get; set; } = "";

    /// <summary>Language of the annotated text block.</summary>
    public string Language { get; set; } = "";

    /// <summary>One of highlight, note, or bookmark.</summary>
    public string Kind { get; set; } = "";

    /// <summary>Start character offset in the rendered section.</summary>
    public int StartOffset { get; set; }

    /// <summary>Exclusive end character offset in the rendered section.</summary>
    public int EndOffset { get; set; }

    /// <summary>Optional verse, ayah, or segment reference for keyboard-created actions.</summary>
    public string? SegmentReference { get; set; }

    /// <summary>Optional private note. Source quotation text is not stored.</summary>
    public string? Note { get; set; }

    /// <summary>UTC creation time.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>UTC last-update time.</summary>
    public DateTime UpdatedAt { get; set; }
}
