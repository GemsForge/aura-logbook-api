namespace AuraLogbook.Api.Services.Spotify;

/// <summary>Safe, actionable integration failure; excludes provider bodies, codes and tokens.</summary>
public sealed class SpotifyIntegrationException(string code, string message, int statusCode = 502) : Exception(message)
{
    public string Code { get; } = code;
    public int StatusCode { get; } = statusCode;
}
