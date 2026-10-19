using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Tests;

internal static class MigrationTestDatabase
{
    public static SqliteConnection OpenAll()
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        Execute(connection, "PRAGMA foreign_keys = ON;");

        var migrationDirectory = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"));
        foreach (var path in Directory.EnumerateFiles(migrationDirectory, "*.sql").OrderBy(path => path, StringComparer.Ordinal))
            Execute(connection, File.ReadAllText(path));

        return connection;
    }

    public static SqliteConnection Open(params string[] migrationNames)
    {
        var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        Execute(connection, "PRAGMA foreign_keys = ON;");

        var migrationDirectory = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations"));
        foreach (var name in migrationNames)
            Execute(connection, File.ReadAllText(Path.Combine(migrationDirectory, name)));

        return connection;
    }

    public static void Execute(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    public static object? Scalar(SqliteConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        var value = command.ExecuteScalar();
        return value is DBNull ? null : value;
    }
}
