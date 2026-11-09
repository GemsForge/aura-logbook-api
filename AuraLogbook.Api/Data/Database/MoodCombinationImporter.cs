using System.Text;
using System.Text.Json;
using AuraLogbook.Api.Models.Enums;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Data.Database;

/// <summary>Validates, imports, and reconciles pathway-specific interpretations for mood combinations.</summary>
public static class MoodCombinationImporter
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly IReadOnlyDictionary<string, int> PathwayKeys = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
    {
        ["mindful"] = 0,
        ["astrology-energy"] = 1,
        ["faith-religion"] = 2,
    };

    /// <summary>Validates a source snapshot without opening or changing the target database.</summary>
    /// <param name="sourceBytes">The exact bytes that will be imported.</param>
    /// <returns>The number of distinct mood combinations in the source.</returns>
    /// <exception cref="InvalidDataException">The source has invalid, duplicate, or incomplete records.</exception>
    public static int ValidateSource(ReadOnlyMemory<byte> sourceBytes) => ParseSource(sourceBytes).Count;

    /// <summary>Imports a JSON file into an open database using its own transaction.</summary>
    /// <param name="connection">An open SQLite connection with migrations applied.</param>
    /// <param name="sourcePath">Path to the mood-combination JSON source.</param>
    /// <param name="cancellationToken">Cancellation token for file and database operations.</param>
    /// <returns>Source and stored interpretation counts with exact reconciliation status.</returns>
    public static async Task<MoodCombinationImportResult> ImportAsync(
        SqliteConnection connection,
        string sourcePath,
        CancellationToken cancellationToken = default)
    {
        var bytes = await File.ReadAllBytesAsync(sourcePath, cancellationToken);
        await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync(cancellationToken);
        var result = await ImportAsync(connection, bytes, transaction, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return result;
    }

    /// <summary>Imports and reconciles an exact JSON byte snapshot inside the caller's transaction.</summary>
    /// <param name="connection">The open SQLite connection that owns the transaction.</param>
    /// <param name="sourceBytes">The validated source bytes whose hash was approved.</param>
    /// <param name="transaction">The transaction shared with the full data import.</param>
    /// <param name="cancellationToken">Cancellation token for database operations.</param>
    /// <returns>Source and stored interpretation counts with exact reconciliation status.</returns>
    public static async Task<MoodCombinationImportResult> ImportAsync(
        SqliteConnection connection,
        ReadOnlyMemory<byte> sourceBytes,
        SqliteTransaction transaction,
        CancellationToken cancellationToken = default)
    {
        if (!ReferenceEquals(transaction.Connection, connection))
            throw new ArgumentException("The import transaction must belong to the supplied connection.", nameof(transaction));
        var combinations = ParseSource(sourceBytes);
        var rows = combinations.SelectMany(combination => combination.Results.Select(result =>
            new ImportRow(combination.Id, combination.MoodSetKey, JsonSerializer.Serialize(combination.Moods), result.PathwayKey, result.Text))).ToArray();

        await using (var clear = connection.CreateCommand())
        {
            clear.Transaction = transaction;
            clear.CommandText = "DELETE FROM MoodCombinationInterpretations;";
            await clear.ExecuteNonQueryAsync(cancellationToken);
        }
        foreach (var row in rows)
        {
            await using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = """
                INSERT INTO MoodCombinationInterpretations
                    (CombinationId, MoodSetKey, MoodsJson, PathwayKey, Interpretation, IsActive)
                VALUES ($id, $moodSetKey, $moodsJson, $pathwayKey, $interpretation, 1);
                """;
            command.Parameters.AddWithValue("$id", row.Id);
            command.Parameters.AddWithValue("$moodSetKey", row.MoodSetKey);
            command.Parameters.AddWithValue("$moodsJson", row.MoodsJson);
            command.Parameters.AddWithValue("$pathwayKey", row.PathwayKey);
            command.Parameters.AddWithValue("$interpretation", row.Text);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }

        var storedRows = new List<ImportRow>();
        await using (var query = connection.CreateCommand())
        {
            query.Transaction = transaction;
            query.CommandText = "SELECT CombinationId, MoodSetKey, MoodsJson, PathwayKey, Interpretation FROM MoodCombinationInterpretations WHERE IsActive = 1;";
            await using var reader = await query.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
                storedRows.Add(new ImportRow(reader.GetString(0), reader.GetString(1), reader.GetString(2), reader.GetInt32(3), reader.GetString(4)));
        }
        var expected = rows.ToDictionary(Key, row => row, StringComparer.Ordinal);
        var actual = storedRows.ToDictionary(Key, row => row, StringComparer.Ordinal);
        var mismatches = expected.Count(pair => !actual.TryGetValue(pair.Key, out var stored) || stored != pair.Value)
            + actual.Keys.Count(key => !expected.ContainsKey(key));
        return new MoodCombinationImportResult(combinations.Count, rows.Length, storedRows.Count, mismatches == 0, mismatches);
    }

    /// <summary>Creates the stable, case-normalized lookup key used by the database and API.</summary>
    public static string CreateMoodSetKey(IEnumerable<MoodType> moods) => string.Join("|",
        moods.Select(mood => mood.ToString()).Order(StringComparer.Ordinal));

    private static List<CombinationRow> ParseSource(ReadOnlyMemory<byte> sourceBytes)
    {
        var bytes = sourceBytes.Span;
        if (bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF)
            bytes = bytes[3..];
        MoodCombinationLibrary? library;
        try
        {
            library = JsonSerializer.Deserialize<MoodCombinationLibrary>(Encoding.UTF8.GetString(bytes), JsonOptions);
        }
        catch (JsonException exception)
        {
            throw new InvalidDataException("Mood-combination JSON could not be parsed.", exception);
        }
        if (library?.Combinations is null || library.Combinations.Count == 0)
            throw new InvalidDataException("Mood-combination JSON must contain at least one combination.");
        var nullRecords = JsonImportRecordValidator.ValidateNoNullRecords(library.Combinations, "Mood combination");
        if (nullRecords.Count > 0) throw new InvalidDataException(string.Join(" ", nullRecords));

        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var sets = new HashSet<string>(StringComparer.Ordinal);
        var rows = new List<CombinationRow>();
        foreach (var source in library.Combinations)
        {
            if (string.IsNullOrWhiteSpace(source.Id) || !ids.Add(source.Id.Trim()))
                throw new InvalidDataException("Mood-combination records must have unique, non-empty IDs.");
            if (source.Moods is null || source.Moods.Count is < 2 or > 3)
                throw new InvalidDataException("Each mood combination must contain two or three moods.");
            var moods = new List<MoodType>();
            foreach (var moodName in source.Moods)
            {
                if (string.IsNullOrWhiteSpace(moodName) || !Enum.TryParse<MoodType>(moodName.Trim(), true, out var mood) || !Enum.IsDefined(mood))
                    throw new InvalidDataException("A mood-combination source contains an unknown mood.");
                moods.Add(mood);
            }
            if (moods.Distinct().Count() != moods.Count)
                throw new InvalidDataException("A mood combination cannot repeat a mood.");
            var moodSetKey = CreateMoodSetKey(moods);
            if (!sets.Add(moodSetKey)) throw new InvalidDataException("The mood-combination source contains duplicate mood sets.");
            var results = source.Results;
            if (results is null || results.Count != PathwayKeys.Count || results.Keys.Any(key => !PathwayKeys.ContainsKey(key)) ||
                PathwayKeys.Keys.Any(key => !results.ContainsKey(key)))
                throw new InvalidDataException("Each mood combination must provide exactly one interpretation for every supported pathway.");
            var pathwayResults = new List<PathwayResult>();
            foreach (var (pathway, pathwayKey) in PathwayKeys)
            {
                var text = results[pathway];
                if (string.IsNullOrWhiteSpace(text))
                    throw new InvalidDataException("Every mood-combination pathway interpretation must contain text.");
                pathwayResults.Add(new PathwayResult(pathwayKey, text));
            }
            rows.Add(new CombinationRow(source.Id.Trim(), moodSetKey, moods.Select(mood => mood.ToString()).ToArray(), pathwayResults));
        }
        return rows;
    }

    private static string Key(ImportRow row) => $"{row.Id}\0{row.PathwayKey}";
    private sealed class MoodCombinationLibrary { public List<MoodCombinationSource>? Combinations { get; set; } }
    private sealed class MoodCombinationSource { public string? Id { get; set; } public List<string>? Moods { get; set; } public Dictionary<string, string>? Results { get; set; } }
    private sealed record CombinationRow(string Id, string MoodSetKey, IReadOnlyList<string> Moods, IReadOnlyList<PathwayResult> Results);
    private sealed record PathwayResult(int PathwayKey, string Text);
    private sealed record ImportRow(string Id, string MoodSetKey, string MoodsJson, int PathwayKey, string Text);
}

/// <summary>Reports source and stored mood-combination counts and whether every pathway interpretation matches.</summary>
public sealed record MoodCombinationImportResult(int Combinations, int Interpretations, int StoredInterpretations, bool MatchesSource, int Mismatches);
