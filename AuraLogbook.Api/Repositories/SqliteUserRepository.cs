using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

public sealed class SqliteUserRepository : IFileUserRepository
{
    private readonly IDbConnectionFactory _factory;
    public SqliteUserRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<User>> GetAllAsync() { using var c = _factory.CreateConnection(); return (await c.QueryAsync<UserRow>("SELECT * FROM Users ORDER BY Id")).Select(Map).ToList(); }
    public async Task<User?> GetByEmailAsync(string email) { using var c = _factory.CreateConnection(); var row = await c.QuerySingleOrDefaultAsync<UserRow>("SELECT * FROM Users WHERE Email = @email", new { email }); return row is null ? null : Map(row); }
    public async Task<User?> GetByIdAsync(int id) { using var c = _factory.CreateConnection(); var row = await c.QuerySingleOrDefaultAsync<UserRow>("SELECT * FROM Users WHERE Id = @id", new { id }); return row is null ? null : Map(row); }
    public async Task<int> CreateAsync(User user) { using var c = _factory.CreateConnection(); return await c.ExecuteScalarAsync<int>("INSERT INTO Users (Email, PasswordHash, DisplayName, Birthday, ZodiacSign, AuraColor, AuraIntensity, Avatar, Motto, SelectedPathway, CreatedAt, UpdatedAt) VALUES (@Email,@PasswordHash,@DisplayName,@Birthday,@ZodiacSign,@AuraColor,@AuraIntensity,@Avatar,@Motto,@SelectedPathway,@CreatedAt,@UpdatedAt) RETURNING Id", user); }
    public async Task<bool> UpdateAsync(User user) { using var c = _factory.CreateConnection(); return await c.ExecuteAsync("UPDATE Users SET Email=@Email, PasswordHash=@PasswordHash, DisplayName=@DisplayName, Birthday=@Birthday, ZodiacSign=@ZodiacSign, AuraColor=@AuraColor, AuraIntensity=@AuraIntensity, Avatar=@Avatar, Motto=@Motto, SelectedPathway=@SelectedPathway, UpdatedAt=@UpdatedAt WHERE Id=@Id", user) == 1; }
    public async Task<bool> DeleteAsync(int id) { using var c = _factory.CreateConnection(); return await c.ExecuteAsync("DELETE FROM Users WHERE Id=@id", new { id }) == 1; }
    public async Task<List<User>> SearchAsync(string query) { using var c = _factory.CreateConnection(); return (await c.QueryAsync<UserRow>("SELECT * FROM Users WHERE Email LIKE @query OR DisplayName LIKE @query ORDER BY Id", new { query = $"%{query}%" })).Select(Map).ToList(); }
    public async Task ClearAsync() { using var c = _factory.CreateConnection(); await c.ExecuteAsync("DELETE FROM Users"); }

    private static User Map(UserRow row) => new()
    {
        Id = row.Id, Email = row.Email, PasswordHash = row.PasswordHash, DisplayName = row.DisplayName,
        Birthday = DateOnly.TryParse(row.Birthday, out var birthday) ? birthday : default,
        ZodiacSign = row.ZodiacSign ?? string.Empty, AuraColor = row.AuraColor, AuraIntensity = row.AuraIntensity,
        Avatar = row.Avatar, Motto = row.Motto, SelectedPathway = (SpiritualPathway)row.SelectedPathway,
        CreatedAt = row.CreatedAt, UpdatedAt = row.UpdatedAt
    };

    private sealed class UserRow
    {
        public int Id { get; set; } public string Email { get; set; } = ""; public string PasswordHash { get; set; } = "";
        public string? DisplayName { get; set; } public string? Birthday { get; set; } public string? ZodiacSign { get; set; }
        public string AuraColor { get; set; } = "blue"; public int AuraIntensity { get; set; } public string? Avatar { get; set; }
        public string? Motto { get; set; } public int SelectedPathway { get; set; } public string CreatedAt { get; set; } = ""; public string UpdatedAt { get; set; } = "";
    }
}
