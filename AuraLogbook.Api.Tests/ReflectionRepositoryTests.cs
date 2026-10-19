using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Tests;

public sealed class ReflectionRepositoryTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(Path.GetTempPath(), $"aura-reflections-{Guid.NewGuid():N}.db");
    private readonly SqliteConnectionFactory _factory;
    private readonly string _migrationDirectory = Path.GetFullPath(Path.Combine(
        AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"));

    public ReflectionRepositoryTests()
    {
        using (var connection = new SqliteConnection($"Data Source={_databasePath}"))
        {
            connection.Open();
            Execute(connection, "PRAGMA foreign_keys = OFF;");
            foreach (var migration in Directory.EnumerateFiles(_migrationDirectory, "*.sql").OrderBy(path => path))
                Execute(connection, File.ReadAllText(migration));

            var reflectionMigration = File.ReadAllText(Path.Combine(_migrationDirectory, "005_reflection_prompts_and_responses.sql"));
            Execute(connection, reflectionMigration);
            Execute(connection, reflectionMigration);
        }

        _factory = new SqliteConnectionFactory(new TestOptions(new DatabaseOptions { ConnectionString = $"Data Source={_databasePath}" }));
        SeedRows();
    }

    [Fact]
    public async Task Prompt_filter_includes_universal_and_matching_context_only()
    {
        var repository = new SqliteReflectionRepository(_factory);

        var prompts = await repository.GetActivePromptsAsync(1, "BLUE", "throat");

        Assert.Equal(["energy-blue", "daily-check-in"], prompts.Select(prompt => prompt.PromptKey));
    }

    [Fact]
    public async Task Prompt_filter_supports_each_optional_context_independently()
    {
        var repository = new SqliteReflectionRepository(_factory);

        var faithPrompts = await repository.GetActivePromptsAsync(2, null, null);
        var redAuraPrompts = await repository.GetActivePromptsAsync(null, "red", null);
        var heartPrompts = await repository.GetActivePromptsAsync(null, null, "heart");

        Assert.Equal(["heart-reflection", "daily-check-in", "faith-support"], faithPrompts.Select(prompt => prompt.PromptKey));
        Assert.Equal(["energy-red", "heart-reflection", "daily-check-in", "faith-support"], redAuraPrompts.Select(prompt => prompt.PromptKey));
        Assert.Equal(["heart-reflection", "daily-check-in", "faith-support"], heartPrompts.Select(prompt => prompt.PromptKey));
    }

    [Fact]
    public async Task Responses_are_saved_and_retrieved_only_for_the_authenticated_user()
    {
        var repository = new SqliteReflectionRepository(_factory);

        var created = await repository.CreateResponseAsync(7, 1, 100, "  I felt grounded today.  ");

        Assert.NotNull(created);
        Assert.Equal("I felt grounded today.", created.ResponseText);
        Assert.Equal(100, created.MoodEntryId);
        Assert.Single(await repository.GetResponsesAsync(7, 100));
        Assert.Empty(await repository.GetResponsesAsync(8, 100));
        Assert.NotNull(await repository.GetResponseAsync(7, created.Id));
        Assert.Null(await repository.GetResponseAsync(8, created.Id));
    }

    [Fact]
    public async Task Response_cannot_be_attached_to_another_users_entry_or_inactive_prompt()
    {
        var repository = new SqliteReflectionRepository(_factory);

        Assert.Null(await repository.CreateResponseAsync(7, 1, 200, "Not my entry"));
        Assert.Null(await repository.CreateResponseAsync(7, 4, 100, "Inactive prompt"));
        Assert.Empty(await repository.GetResponsesAsync(7, null));
    }

    [Fact]
    public void Reflection_response_schema_enforces_user_prompt_and_entry_foreign_keys()
    {
        using var connection = _factory.CreateConnection();
        Assert.Equal(
            new HashSet<string>(["SpiritualPathways", "AuraColorDefinitions", "ChakraDefinitions"], StringComparer.Ordinal),
            GetForeignKeyTables(connection, "ReflectionPrompts"));
        Assert.Equal(
            new HashSet<string>(["Users", "ReflectionPrompts", "MoodEntries"], StringComparer.Ordinal),
            GetForeignKeyTables(connection, "ReflectionResponses"));

        using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO ReflectionResponses (UserId, PromptId, MoodEntryId, ResponseText, CreatedAt, UpdatedAt)
            VALUES (999, 1, 100, 'Invalid owner', 'now', 'now');
            """;

        Assert.Throws<SqliteException>(() => command.ExecuteNonQuery());
    }

    private void SeedRows()
    {
        using (var connection = _factory.CreateConnection())
        {
            Execute(connection, """
                INSERT INTO SpiritualPathways (PathwayKey, DisplayName, Description)
                VALUES (1, 'Energy', 'Color and energy reflection'), (2, 'Faith', 'User-defined spiritual reflection');
                INSERT INTO Users (Id, Email, PasswordHash, AuraColor, SelectedPathway, CreatedAt, UpdatedAt)
                VALUES
                    (7, 'one@example.com', 'hash', 'blue', 0, 'now', 'now'),
                    (8, 'two@example.com', 'hash', 'red', 0, 'now', 'now');
                INSERT INTO ReflectionPrompts
                    (Id, PromptKey, PromptText, Category, PathwayKey, AuraColorKey, ChakraKey, IsActive, CreatedAt, UpdatedAt)
                VALUES
                    (1, 'daily-check-in', 'What did you notice today?', 'Daily', NULL, NULL, NULL, 1, 'now', 'now'),
                    (2, 'energy-blue', 'What does blue bring to mind?', 'Aura', 1, 'blue', 'throat', 1, 'now', 'now'),
                    (3, 'energy-red', 'What helps you feel grounded?', 'Aura', 1, 'red', 'root', 1, 'now', 'now'),
                    (4, 'inactive', 'Inactive prompt', 'Daily', NULL, NULL, NULL, 0, 'now', 'now'),
                    (5, 'faith-support', 'What brings you a sense of hope?', 'Spiritual', 2, NULL, NULL, 1, 'now', 'now'),
                    (6, 'heart-reflection', 'What connection felt meaningful?', 'Chakra', NULL, NULL, 'heart', 1, 'now', 'now');
                """);
        }

        // Migration 004 in the current baseline leaves MoodEntries referencing its renamed legacy
        // Users table; the independent registration repair migration is tracked outside this story.
        using var legacyConnection = new SqliteConnection($"Data Source={_databasePath}");
        legacyConnection.Open();
        Execute(legacyConnection, "PRAGMA foreign_keys = OFF;");
        Execute(legacyConnection, """
            INSERT INTO MoodEntries (Id, UserId, EntryDate, CreatedAt, UpdatedAt)
            VALUES
                (100, 7, '2026-10-19', 'now', 'now'),
                (200, 8, '2026-10-19', 'now', 'now');
            """);
    }

    private static void Execute(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    private static HashSet<string> GetForeignKeyTables(SqliteConnection connection, string tableName)
    {
        using var command = connection.CreateCommand();
        command.CommandText = $"PRAGMA foreign_key_list({tableName});";
        using var reader = command.ExecuteReader();
        var tables = new HashSet<string>(StringComparer.Ordinal);
        while (reader.Read())
            tables.Add(reader.GetString(2));
        return tables;
    }

    public void Dispose()
    {
        if (File.Exists(_databasePath))
            File.Delete(_databasePath);
    }

    private sealed class TestOptions(DatabaseOptions value) : IOptions<DatabaseOptions>
    {
        public DatabaseOptions Value { get; } = value;
    }
}
