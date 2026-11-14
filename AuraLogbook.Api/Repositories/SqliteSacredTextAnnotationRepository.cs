using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using Dapper;

namespace AuraLogbook.Api.Repositories;

/// <summary>SQLite/Dapper repository for owner-private, version-bound reading annotations.</summary>
public sealed class SqliteSacredTextAnnotationRepository : ISacredTextAnnotationRepository
{
    private readonly IDbConnectionFactory _factory;

    /// <summary>Creates the repository with the configured SQLite connection factory.</summary>
    public SqliteSacredTextAnnotationRepository(IDbConnectionFactory factory) => _factory = factory;

    /// <inheritdoc />
    public async Task<List<SacredTextAnnotation>> GetByUserAsync(int userId, string framework, string? sectionReference)
    {
        using var connection = _factory.CreateConnection();
        var rows = await connection.QueryAsync<AnnotationRow>("""
            SELECT Id, UserId, Framework, SectionReference, SourceVersion, Language, Kind,
                   StartOffset, EndOffset, SegmentReference, Note, CreatedAt, UpdatedAt
            FROM SacredTextAnnotations
            WHERE UserId = @userId AND Framework = @framework
              AND (@sectionReference IS NULL OR SectionReference = @sectionReference)
            ORDER BY CreatedAt DESC;
            """, new { userId, framework, sectionReference });
        return rows.Select(Map).ToList();
    }

    /// <inheritdoc />
    public async Task<SacredTextAnnotation?> GetByIdAsync(int userId, int id)
    {
        using var connection = _factory.CreateConnection();
        var row = await connection.QuerySingleOrDefaultAsync<AnnotationRow>("""
            SELECT Id, UserId, Framework, SectionReference, SourceVersion, Language, Kind,
                   StartOffset, EndOffset, SegmentReference, Note, CreatedAt, UpdatedAt
            FROM SacredTextAnnotations
            WHERE UserId = @userId AND Id = @id;
            """, new { userId, id });
        return row is null ? null : Map(row);
    }

    /// <inheritdoc />
    public async Task<int> CreateAsync(SacredTextAnnotation annotation)
    {
        using var connection = _factory.CreateConnection();
        return await connection.ExecuteScalarAsync<int>("""
            INSERT INTO SacredTextAnnotations
                (UserId, Framework, SectionReference, SourceVersion, Language, Kind, StartOffset, EndOffset,
                 SegmentReference, Note, CreatedAt, UpdatedAt)
            VALUES
                (@UserId, @Framework, @SectionReference, @SourceVersion, @Language, @Kind, @StartOffset, @EndOffset,
                 @SegmentReference, @Note, @CreatedAt, @UpdatedAt)
            RETURNING Id;
            """, annotation);
    }

    /// <inheritdoc />
    public async Task<bool> UpdateAsync(int userId, int id, string? note, DateTime updatedAt)
    {
        using var connection = _factory.CreateConnection();
        return await connection.ExecuteAsync("""
            UPDATE SacredTextAnnotations
            SET Note = @note, UpdatedAt = @updatedAt
            WHERE UserId = @userId AND Id = @id;
            """, new { userId, id, note, updatedAt }) == 1;
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int userId, int id)
    {
        using var connection = _factory.CreateConnection();
        return await connection.ExecuteAsync(
            "DELETE FROM SacredTextAnnotations WHERE UserId = @userId AND Id = @id;", new { userId, id }) == 1;
    }

    /// <summary>Restores timestamps and maps one detached row.</summary>
    private static SacredTextAnnotation Map(AnnotationRow row) => new()
    {
        Id = row.Id,
        UserId = row.UserId,
        Framework = row.Framework,
        SectionReference = row.SectionReference,
        SourceVersion = row.SourceVersion,
        Language = row.Language,
        Kind = row.Kind,
        StartOffset = row.StartOffset,
        EndOffset = row.EndOffset,
        SegmentReference = row.SegmentReference,
        Note = row.Note,
        CreatedAt = ParseUtc(row.CreatedAt),
        UpdatedAt = ParseUtc(row.UpdatedAt)
    };

    /// <summary>Stored timestamps are UTC and serialize with a stable UTC offset.</summary>
    private static DateTime ParseUtc(string value) => DateTime.Parse(value, System.Globalization.CultureInfo.InvariantCulture,
        System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal);

    private sealed class AnnotationRow
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Framework { get; set; } = "";
        public string SectionReference { get; set; } = "";
        public string SourceVersion { get; set; } = "";
        public string Language { get; set; } = "";
        public string Kind { get; set; } = "";
        public int StartOffset { get; set; }
        public int EndOffset { get; set; }
        public string? SegmentReference { get; set; }
        public string? Note { get; set; }
        public string CreatedAt { get; set; } = "";
        public string UpdatedAt { get; set; } = "";
    }
}
