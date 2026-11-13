using System.Text.Json;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Data.Database;

/// <summary>
/// Resolves the SQLite file selected by an API appsettings file so offline tools (such as the
/// DatabaseSeeder) write to the same database the running API reads.
/// </summary>
public static class SqliteDataSourceResolver
{
    /// <summary>Reads <c>Database:ConnectionString</c> from an appsettings JSON file and returns its absolute file path.</summary>
    /// <param name="appSettingsPath">Path to the API appsettings file, e.g. <c>AuraLogbook.Api/appsettings.Development.json</c>.</param>
    /// <returns>
    /// The absolute database path. A relative <c>Data Source</c> is resolved against the appsettings directory,
    /// which is the API content root and working directory used by <c>dotnet run</c>.
    /// </returns>
    /// <exception cref="InvalidDataException">The file has no usable file-based connection string.</exception>
    public static string ResolveDatabasePath(string appSettingsPath)
    {
        var fullSettingsPath = Path.GetFullPath(appSettingsPath);
        using var document = JsonDocument.Parse(File.ReadAllText(fullSettingsPath),
            new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip, AllowTrailingCommas = true });
        if (!document.RootElement.TryGetProperty("Database", out var database) ||
            !database.TryGetProperty("ConnectionString", out var value) ||
            value.ValueKind != JsonValueKind.String)
            throw new InvalidDataException($"{fullSettingsPath} does not define Database:ConnectionString.");

        var dataSource = new SqliteConnectionStringBuilder(value.GetString()).DataSource;
        if (string.IsNullOrWhiteSpace(dataSource) || dataSource == ":memory:")
            throw new InvalidDataException($"{fullSettingsPath} does not select a file-based SQLite database.");
        return Path.GetFullPath(dataSource, Path.GetDirectoryName(fullSettingsPath)!);
    }
}
