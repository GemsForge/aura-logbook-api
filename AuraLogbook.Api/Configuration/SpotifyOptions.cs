namespace AuraLogbook.Api.Configuration;

/// <summary>Configuration required to connect Aura Logbook to Spotify.</summary>
public sealed class SpotifyOptions
{
    public const string SectionName = "Spotify";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
    public string RedirectUri { get; set; } = "";
    public string FrontendRedirectUri { get; set; } = "";
    public string ApiBaseUrl { get; set; } = "https://api.spotify.com/v1";
}
