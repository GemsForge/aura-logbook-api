namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Server-side credentials and provider settings for FreeAstroAPI.</summary>
public sealed class FreeAstroApiOptions
{
    public const string SectionName = "FreeAstroApi";

    /// <summary>API key supplied through deployment configuration, never returned to the client.</summary>
    public string ApiKey { get; set; } = string.Empty;
}
