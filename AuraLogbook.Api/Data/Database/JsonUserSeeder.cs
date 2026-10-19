using System.Globalization;
using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Data.Database;

public sealed class JsonUserSeeder
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<JsonUserSeeder> _logger;

    public JsonUserSeeder(
        IDbConnectionFactory connectionFactory,
        IWebHostEnvironment environment,
        ILogger<JsonUserSeeder> logger)
    {
        _connectionFactory = connectionFactory;
        _environment = environment;
        _logger = logger;
    }

    public async Task SeedUsersAsync(CancellationToken cancellationToken = default)
    {
        var sourcePath = Path.Combine(_environment.ContentRootPath, "Data", "users.json");
        if (!File.Exists(sourcePath))
        {
            _logger.LogWarning("User seed source was not found at {SourcePath}", sourcePath);
            return;
        }

        var users = JsonSerializer.Deserialize<List<SeedUser>>(
            await File.ReadAllTextAsync(sourcePath, cancellationToken),
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

        await using var connection = _connectionFactory.CreateConnection();
        await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync(cancellationToken);
        var count = 0;

        foreach (var user in users)
        {
            if (user.Id <= 0 || string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.PasswordHash))
                throw new InvalidOperationException($"Invalid user seed record with ID {user.Id}.");

            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = """
                INSERT INTO Users
                    (Id, Email, PasswordHash, DisplayName, Birthday, ZodiacSign, AuraColor, AuraIntensity, Avatar, Motto, SelectedPathway, CreatedAt, UpdatedAt)
                VALUES
                    ($id, $email, $passwordHash, $displayName, $birthday, $zodiacSign, $auraColor, $auraIntensity, $avatar, $motto, $selectedPathway, $createdAt, $updatedAt)
                ON CONFLICT(Email) DO UPDATE SET
                    PasswordHash = excluded.PasswordHash, DisplayName = excluded.DisplayName,
                    Birthday = excluded.Birthday, ZodiacSign = excluded.ZodiacSign, AuraColor = excluded.AuraColor,
                    AuraIntensity = excluded.AuraIntensity, Avatar = excluded.Avatar, Motto = excluded.Motto,
                    SelectedPathway = excluded.SelectedPathway, CreatedAt = excluded.CreatedAt, UpdatedAt = excluded.UpdatedAt;
                """;
            command.Parameters.AddWithValue("$id", user.Id);
            command.Parameters.AddWithValue("$email", user.Email.Trim());
            command.Parameters.AddWithValue("$passwordHash", user.PasswordHash);
            command.Parameters.AddWithValue("$displayName", (object?)user.DisplayName ?? DBNull.Value);
            command.Parameters.AddWithValue("$birthday", NormalizeBirthday(user.Birthday) ?? (object)DBNull.Value);
            command.Parameters.AddWithValue("$zodiacSign", (object?)user.ZodiacSign ?? DBNull.Value);
            command.Parameters.AddWithValue("$auraColor", string.IsNullOrWhiteSpace(user.AuraColor) ? "blue" : user.AuraColor.ToLowerInvariant());
            command.Parameters.AddWithValue("$auraIntensity", NormalizeIntensity(user.AuraIntensity));
            command.Parameters.AddWithValue("$avatar", (object?)user.Avatar ?? DBNull.Value);
            command.Parameters.AddWithValue("$motto", (object?)user.Motto ?? DBNull.Value);
            command.Parameters.AddWithValue("$selectedPathway", user.SelectedPathway);
            command.Parameters.AddWithValue("$createdAt", ParseTimestamp(user.CreatedAt).ToString("O"));
            command.Parameters.AddWithValue("$updatedAt", ParseTimestamp(user.UpdatedAt).ToString("O"));
            await command.ExecuteNonQueryAsync(cancellationToken);
            count++;
        }

        await transaction.CommitAsync(cancellationToken);
        _logger.LogInformation("Seeded {UserCount} user records from {SourcePath} into the development database", count, sourcePath);
    }

    private static DateTime ParseTimestamp(string? value) =>
        DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out var timestamp)
            ? timestamp
            : throw new InvalidOperationException($"Invalid user timestamp: {value}");

    private static string? NormalizeBirthday(string? value) =>
        DateOnly.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) && date != DateOnly.MinValue
            ? date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : null;

    private static int NormalizeIntensity(int value) => value > 100
        ? Math.Clamp((int)Math.Round(value / 10d), 0, 100)
        : Math.Clamp(value, 0, 100);

    private sealed class SeedUser
    {
        public int Id { get; set; }
        public string? Email { get; set; }
        public string? PasswordHash { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }
        public string? DisplayName { get; set; }
        public string? Birthday { get; set; }
        public string? ZodiacSign { get; set; }
        public string? AuraColor { get; set; }
        public int AuraIntensity { get; set; }
        public string? Avatar { get; set; }
        public string? Motto { get; set; }
        public int SelectedPathway { get; set; }
    }
}
