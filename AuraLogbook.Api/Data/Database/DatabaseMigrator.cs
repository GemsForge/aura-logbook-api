using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Data.Database;

public sealed class DatabaseMigrator
{
    private readonly IDbConnectionFactory _connectionFactory;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DatabaseMigrator> _logger;

    /// <summary>Initializes a migrator that discovers SQL migrations in the application data directory.</summary>
    public DatabaseMigrator(
        IDbConnectionFactory connectionFactory,
        IWebHostEnvironment environment,
        ILogger<DatabaseMigrator> logger)
    {
        _connectionFactory = connectionFactory;
        _environment = environment;
        _logger = logger;
    }

    /// <summary>Applies pending migrations in filename order and records each successful migration.</summary>
    public void ApplyMigrations()
    {
        using var connection = _connectionFactory.CreateConnection();
        EnsureMigrationTable(connection);

        var migrationDirectory = Path.Combine(
            _environment.ContentRootPath,
            "Data",
            "Database",
            "Migrations");

        foreach (var path in Directory.EnumerateFiles(migrationDirectory, "*.sql").OrderBy(x => x))
        {
            var name = Path.GetFileName(path);
            if (HasApplied(connection, name))
                continue;

            using var transaction = connection.BeginTransaction();
            var sql = File.ReadAllText(path);

            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = sql;
            command.ExecuteNonQuery();

            using var record = connection.CreateCommand();
            record.Transaction = transaction;
            record.CommandText = "INSERT INTO __SchemaMigrations (MigrationName, AppliedAt) VALUES ($name, $appliedAt);";
            record.Parameters.AddWithValue("$name", name);
            record.Parameters.AddWithValue("$appliedAt", DateTime.UtcNow.ToString("O"));
            record.ExecuteNonQuery();

            transaction.Commit();
            _logger.LogInformation("Applied database migration {MigrationName}", name);
        }
    }

    private static void EnsureMigrationTable(SqliteConnection connection)
    {
        using var command = connection.CreateCommand();
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS __SchemaMigrations (
                MigrationName TEXT NOT NULL PRIMARY KEY,
                AppliedAt TEXT NOT NULL
            );
            """;
        command.ExecuteNonQuery();
    }

    private static bool HasApplied(SqliteConnection connection, string name)
    {
        using var command = connection.CreateCommand();
        command.CommandText = "SELECT EXISTS (SELECT 1 FROM __SchemaMigrations WHERE MigrationName = $name);";
        command.Parameters.AddWithValue("$name", name);
        return Convert.ToInt32(command.ExecuteScalar()) == 1;
    }
}
