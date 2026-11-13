using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Data.Database;

/// <summary>
/// Imports the curated mood-combination reflections when the API starts (#365), so a new or upgraded
/// database serves curated text without anyone running the DatabaseSeeder by hand. It runs after
/// migrations, reuses the idempotent <see cref="MoodCombinationImporter"/>, and never touches users or
/// mood entries. A missing or invalid source is logged and leaves existing reflection rows unchanged:
/// the importer validates before it replaces rows, all inside one transaction.
/// </summary>
public sealed class ReflectionStartupImporter(
    IDbConnectionFactory connections,
    IOptions<DatabaseOptions> options,
    ILogger<ReflectionStartupImporter> logger)
{
    /// <summary>Runs the import when enabled.</summary>
    /// <returns>The reconciliation result, or null when the import is disabled or failed.</returns>
    public async Task<MoodCombinationImportResult?> ImportAsync(CancellationToken cancellationToken = default)
    {
        var settings = options.Value;
        if (!settings.ImportReflectionsOnStartup)
        {
            logger.LogInformation("Startup reflection import is disabled.");
            return null;
        }

        var sourcePath = Path.GetFullPath(settings.ReflectionsSourcePath, AppContext.BaseDirectory);
        if (!File.Exists(sourcePath))
        {
            logger.LogError("Curated reflection source was not found at {SourcePath}; existing reflections were kept.", sourcePath);
            return null;
        }

        try
        {
            using var connection = connections.CreateConnection();
            var result = await MoodCombinationImporter.ImportAsync(connection, sourcePath, cancellationToken);
            if (result.MatchesSource)
                logger.LogInformation(
                    "Imported curated reflections: {Combinations} combinations, {Expected} expected / {Stored} stored interpretations. Status: reconciled.",
                    result.Combinations, result.Interpretations, result.StoredInterpretations);
            else
                logger.LogError(
                    "Curated reflections do not match the source: {Expected} expected / {Stored} stored, {Mismatches} mismatches.",
                    result.Interpretations, result.StoredInterpretations, result.Mismatches);
            return result;
        }
        catch (InvalidDataException exception)
        {
            logger.LogError(exception, "Curated reflection source at {SourcePath} is invalid; existing reflections were kept.", sourcePath);
            return null;
        }
    }
}
