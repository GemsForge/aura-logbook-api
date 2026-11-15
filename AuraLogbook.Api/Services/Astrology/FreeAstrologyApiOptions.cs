namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Server-side credentials for optional FreeAstrologyAPI natal chart requests.</summary>
public sealed class FreeAstrologyApiOptions
{
    /// <summary>Configuration section bound by the API host.</summary>
    public const string SectionName = "FreeAstrologyApi";

    /// <summary>Provider key supplied by deployment configuration; never sent to the browser.</summary>
    public string ApiKey { get; set; } = string.Empty;
}
