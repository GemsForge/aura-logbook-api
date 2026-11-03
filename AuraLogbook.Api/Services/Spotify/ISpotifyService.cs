namespace AuraLogbook.Api.Services.Spotify;

/// <summary>Coordinates Spotify authorization and metadata access for Aura users.</summary>
public interface ISpotifyService
{
    string CreateAuthorizationUrl(int userId);
    Task CompleteAuthorizationAsync(string state, string code, CancellationToken cancellationToken);
    Task<bool> IsConnectedAsync(int userId);
    Task DisconnectAsync(int userId);
    Task<string?> GetCurrentlyPlayingAsync(int userId, CancellationToken cancellationToken);
    Task<string> GetPlaylistsAsync(int userId, CancellationToken cancellationToken);
}
