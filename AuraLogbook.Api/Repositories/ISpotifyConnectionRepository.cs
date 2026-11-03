using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories;

/// <summary>Persists encrypted Spotify connection records for Aura users.</summary>
public interface ISpotifyConnectionRepository
{
    Task<SpotifyConnectionRecord?> GetAsync(int userId);
    Task SaveAsync(SpotifyConnectionRecord connection);
    Task DeleteAsync(int userId);
}
