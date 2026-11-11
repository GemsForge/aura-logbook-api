using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>SQLite-backed <see cref="IPasswordResetTokenRepository"/>; stores token hashes only.</summary>
public sealed class SqlitePasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly IDbConnectionFactory _factory;
    public SqlitePasswordResetTokenRepository(IDbConnectionFactory factory) => _factory = factory;

    /// <inheritdoc />
    public async Task IssueAsync(PasswordResetToken token)
    {
        using var db = _factory.CreateConnection();
        using var tx = db.BeginTransaction();
        // Supersede older unused links, and prune long-dead rows so the table stays small.
        await db.ExecuteAsync("UPDATE PasswordResetTokens SET UsedAt=@CreatedAt WHERE UserId=@UserId AND UsedAt IS NULL", token, tx);
        await db.ExecuteAsync("DELETE FROM PasswordResetTokens WHERE ExpiresAt < @cutoff", new { cutoff = token.CreatedAt.AddDays(-1) }, tx);
        await db.ExecuteAsync("INSERT INTO PasswordResetTokens (UserId,TokenHash,CreatedAt,ExpiresAt,UsedAt) VALUES (@UserId,@TokenHash,@CreatedAt,@ExpiresAt,NULL)", token, tx);
        tx.Commit();
    }

    /// <inheritdoc />
    public async Task<int?> ConsumeAsync(string tokenHash, DateTime now)
    {
        using var db = _factory.CreateConnection();
        // A single conditional UPDATE...RETURNING makes redemption race-free: only one caller wins.
        return await db.QuerySingleOrDefaultAsync<int?>(
            "UPDATE PasswordResetTokens SET UsedAt=@now WHERE TokenHash=@tokenHash AND UsedAt IS NULL AND ExpiresAt > @now RETURNING UserId",
            new { tokenHash, now });
    }
}
