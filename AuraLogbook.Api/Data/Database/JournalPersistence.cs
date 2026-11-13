using AuraLogbook.Api.Repositories;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Data.Database;

/// <summary>
/// One persistence path for core journal data in every environment (#353): users, mood entries, and
/// zodiac insights are stored in the migrated SQLite database. The JSON file repositories remain in the
/// codebase only as import/audit sources for the DatabaseSeeder; no request path writes them.
/// </summary>
public static class JournalPersistence
{
    /// <summary>The development database file name; Production must never point at it.</summary>
    public const string DevelopmentDatabaseFile = "auralogbook-dev.db";

    /// <summary>Registers the relational user, mood, and zodiac-insight repositories.</summary>
    public static IServiceCollection AddRelationalJournalRepositories(this IServiceCollection services)
    {
        services.AddScoped<IFileUserRepository, SqliteUserRepository>();
        services.AddScoped<IFileMoodRepository, SqliteMoodRepository>();
        services.AddScoped<IFileZodiacInsightsRepository, SqliteZodiacInsightsRepository>();
        return services;
    }

    /// <summary>
    /// Production must name its own durable database explicitly (e.g. <c>Database__ConnectionString</c> on a
    /// persistent volume). Returns a message when the configured value is missing, in-memory, or still the
    /// development default, so startup can stop before any request is served; otherwise null.
    /// </summary>
    /// <param name="configuredConnectionString">The raw <c>Database:ConnectionString</c> from configuration, or null.</param>
    public static string? ValidateProductionConnection(string? configuredConnectionString)
    {
        if (string.IsNullOrWhiteSpace(configuredConnectionString))
            return "Production requires Database:ConnectionString pointing to a durable SQLite file.";
        var dataSource = new SqliteConnectionStringBuilder(configuredConnectionString).DataSource;
        if (string.IsNullOrWhiteSpace(dataSource) || dataSource == ":memory:" ||
            configuredConnectionString.Contains("Mode=Memory", StringComparison.OrdinalIgnoreCase))
            return "Production requires a file-based SQLite database, not an in-memory one.";
        if (Path.GetFileName(dataSource).Equals(DevelopmentDatabaseFile, StringComparison.OrdinalIgnoreCase))
            return $"Production must not use the development database file ({DevelopmentDatabaseFile}).";
        return null;
    }
}
