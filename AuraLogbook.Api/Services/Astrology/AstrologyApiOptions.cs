namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Server-side credentials for optional Astrology-API.io natal chart requests.</summary>
public sealed class AstrologyApiOptions
{
    /// <summary>Configuration section bound by the API host.</summary>
    public const string SectionName = "AstrologyApi";

    /// <summary>Provider key supplied by deployment configuration; never sent to the browser.</summary>
    public string ApiKey { get; set; } = string.Empty;
}
