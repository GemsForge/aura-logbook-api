using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Services.Spotify;

/// <summary>Coordinates Spotify authorization and metadata access for Aura users.</summary>
public interface ISpotifyService
{
    Task<string> CreateAuthorizationUrlAsync(int userId);
    Task CompleteAuthorizationAsync(string state, string code, CancellationToken cancellationToken);
    Task<SpotifyConnectionStatus> GetConnectionAsync(int userId);
    Task DisconnectAsync(int userId);
    Task<SpotifyPlayback?> GetCurrentlyPlayingAsync(int userId, CancellationToken cancellationToken);
    Task<SpotifyPlaylistPage> GetPlaylistsAsync(int userId, CancellationToken cancellationToken);
}
