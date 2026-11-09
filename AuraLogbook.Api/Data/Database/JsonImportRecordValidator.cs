using System.Text.Json;

namespace AuraLogbook.Api.Data.Database;

/// <summary>Rejects null objects embedded in JSON arrays before import code dereferences their fields.</summary>
public static class JsonImportRecordValidator
{
    /// <summary>Deserializes a JSON array and rejects a null root or null records before import logic can use it.</summary>
    /// <typeparam name="T">The source record type.</typeparam>
    /// <param name="json">The source file bytes used for both parsing and validation.</param>
    /// <param name="sourceName">A safe dataset label used in validation messages.</param>
    /// <param name="options">The serializer options used by the importer.</param>
    /// <returns>The validated source records.</returns>
    /// <exception cref="InvalidDataException">Thrown when the root JSON value or any array item is null.</exception>
    public static List<T> DeserializeArray<T>(byte[] json, string sourceName, JsonSerializerOptions options)
        where T : class
    {
        var records = JsonSerializer.Deserialize<List<T>>(json, options)
            ?? throw new InvalidDataException($"{sourceName} source must be a JSON array, not null.");
        var failures = ValidateNoNullRecords(records, sourceName);
        if (failures.Count > 0)
            throw new InvalidDataException(string.Join(" ", failures));
        return records;
    }

    /// <summary>Returns an actionable error for each null record in a parsed source collection.</summary>
    /// <param name="records">The parsed JSON array records.</param>
    /// <param name="sourceName">A safe dataset label used in validation messages.</param>
    public static IReadOnlyList<string> ValidateNoNullRecords<T>(IReadOnlyList<T> records, string sourceName)
        where T : class
    {
        var failures = new List<string>();
        for (var index = 0; index < records.Count; index++)
        {
            if (records[index] is null)
                failures.Add($"{sourceName} record {index + 1} must not be null.");
        }

        return failures;
    }
}
