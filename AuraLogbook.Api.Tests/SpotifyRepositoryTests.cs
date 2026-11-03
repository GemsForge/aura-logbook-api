using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Tests;

/// <summary>Checks that real SQLite authorization records survive repository recreation and reject replay.</summary>
public sealed class SpotifyRepositoryTests
{
    [Fact]
    public async Task Pending_attempt_is_durable_expiring_and_consumed_once()
    {
        var path = Path.Combine(Path.GetTempPath(), $"spotify-{Guid.NewGuid():N}.db");
        try
        {
            var factory = new SqliteConnectionFactory(Options.Create(new DatabaseOptions { ConnectionString = $"Data Source={path};Pooling=False" }));
            using (var db = factory.CreateConnection())
            {
                using var command = db.CreateCommand();
                command.CommandText = "CREATE TABLE Users (Id INTEGER PRIMARY KEY); INSERT INTO Users VALUES (7);";
                command.ExecuteNonQuery();
                var migration = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations", "011_spotify_oauth_attempts.sql"));
                command.CommandText = File.ReadAllText(migration);
                command.ExecuteNonQuery();
            }
            var repository = new SqliteSpotifyConnectionRepository(factory);
            var expires = DateTime.UtcNow.AddMinutes(10);
            await repository.SaveAttemptAsync(new SpotifyAuthorizationAttempt { UserId = 7, StateHash = "hashed-state", EncryptedVerifier = "ciphertext", RedirectUri = "http://127.0.0.1:5082/api/spotify/callback", ExpiresAt = expires });
            var restored = await new SqliteSpotifyConnectionRepository(factory).ConsumeAttemptAsync("hashed-state");
            Assert.NotNull(restored);
            Assert.Equal(7, restored.UserId);
            Assert.Equal(expires, restored.ExpiresAt);
            Assert.Equal("ciphertext", restored.EncryptedVerifier);
            Assert.Null(await repository.ConsumeAttemptAsync("hashed-state"));
        }
        finally { File.Delete(path); }
    }
}
