using Dapper;
using AuraLogbook.Api.Services;

namespace AuraLogbook.Api.Services;

public class DbInitializer
{
    private readonly DbConnectionFactory _dbFactory;

    public DbInitializer(DbConnectionFactory dbFactory)
    {
        _dbFactory = dbFactory;
    }

    public async Task InitializeAsync()
    {
        using var connection = _dbFactory.CreateConnection();

        const string sql = """
            CREATE TABLE IF NOT EXISTS Users (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                Email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                Password TEXT NOT NULL,
                CreatedAt TEXT NOT NULL
            );
        """;

        await connection.ExecuteAsync(sql);
        Console.WriteLine("✅ Users table created or already exists.");
    }
}
