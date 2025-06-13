using AuraLogbook.Api.Models;
using AuraLogbook.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Connections;

namespace AuraLogbook.Api.Repositories;

public class UserRepository
{
    private readonly DbConnectionFactory _factory;

    public UserRepository(DbConnectionFactory factory)
    {
        _factory = factory;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        using var conn = _factory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Email = @Email", new { Email = email });
    }

    public async Task<User?> GetAllAsync()
    {
        using var conn = _factory.CreateConnection();
        return await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM Users;");
    }

    public async Task<int> CreateAsync(User user)
    {
        using var conn = _factory.CreateConnection();
        var sql = @"INSERT INTO Users (Email, Password, CreatedAt)
                    VALUES (@Email, @Password, @CreatedAt);
                    SELECT last_insert_rowid();";
        return await conn.ExecuteScalarAsync<int>(sql, user);
    }

    public async Task<IEnumerable<string>> GetTableNamesAsync()
    {
        using var connection = _factory.CreateConnection();

        const string sql = @"
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name;
    ";

        var tables = await connection.QueryAsync<string>(sql);

        Console.WriteLine("📋 Tables found:");
        foreach (var table in tables)
            Console.WriteLine($"  - {table}");

        return tables;
    }

    public async Task<int> CreateTestUserAsync()
    {
        using var conn = _factory.CreateConnection();

        var sql = @"INSERT INTO Users (Email, Password, CreatedAt)
                VALUES (@Email, @Password, @CreatedAt);
                SELECT last_insert_rowid();";

        var testUser = new User
        {
            Email = "testuser@example.com",
            PasswordHash = "test-password-hash",
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        return await conn.ExecuteScalarAsync<int>(sql, testUser);
    }

}
