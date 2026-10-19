using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using Dapper;

namespace AuraLogbook.Api.Repositories;

public sealed class SqliteZodiacInsightsRepository : IFileZodiacInsightsRepository
{
    private readonly IDbConnectionFactory _factory;
    private readonly Random _random = new();
    public SqliteZodiacInsightsRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<ZodiacSignInsights?> GetBySignAsync(string sign)
    {
        using var c = _factory.CreateConnection();
        var row = await c.QuerySingleOrDefaultAsync<ZodiacRow>("SELECT * FROM ZodiacSigns WHERE SignKey=@sign", new { sign = sign.ToLowerInvariant() });
        return row is null ? null : await MapAsync(c, row);
    }
    public async Task<List<ZodiacSignInsights>> GetZodiacSignInsightsAsync()
    {
        using var c = _factory.CreateConnection();
        var rows = await c.QueryAsync<ZodiacRow>("SELECT * FROM ZodiacSigns ORDER BY SignKey");
        var result = new List<ZodiacSignInsights>(); foreach (var row in rows) result.Add(await MapAsync(c, row)); return result;
    }
    public async Task<IEnumerable<InsightTemplate>> GetByElementAsync(string element)
    {
        using var c = _factory.CreateConnection();
        return await c.QueryAsync<InsightTemplateRow>("SELECT i.* FROM InsightTemplates i JOIN ZodiacSigns z ON z.SignKey=i.ZodiacSignKey WHERE lower(z.Element)=lower(@element)", new { element }) is var rows
            ? rows.Select(Map).ToList() : [];
    }
    public async Task<InsightTemplate?> GetInsightAsync(string sign, string type)
    { using var c = _factory.CreateConnection(); var row = await c.QuerySingleOrDefaultAsync<InsightTemplateRow>("SELECT * FROM InsightTemplates WHERE ZodiacSignKey=@sign AND lower(InsightType)=lower(@type)", new { sign = sign.ToLowerInvariant(), type }); return row is null ? null : Map(row); }
    public async Task<InsightTemplate?> GetRandomInsightAsync(string sign)
    { var section = await GetBySignAsync(sign); return section?.Insights.Count > 0 ? section.Insights[_random.Next(section.Insights.Count)] : null; }

    private static async Task<ZodiacSignInsights> MapAsync(System.Data.Common.DbConnection c, ZodiacRow row)
    { var rows = await c.QueryAsync<InsightTemplateRow>("SELECT * FROM InsightTemplates WHERE ZodiacSignKey=@sign ORDER BY Id", new { sign = row.SignKey }); return new ZodiacSignInsights { Sign = row.SignKey, Description = row.Description, Element = row.Element, Insights = rows.Select(Map).ToList() }; }
    private static InsightTemplate Map(InsightTemplateRow row) => new() { Type = Enum.TryParse<InsightType>(row.InsightType, true, out var type) ? type : default, Title = row.Title, Message = row.Message };
    private sealed class ZodiacRow { public string SignKey { get; set; } = ""; public string Description { get; set; } = ""; public string Element { get; set; } = ""; }
    private sealed class InsightTemplateRow { public string InsightType { get; set; } = ""; public string Title { get; set; } = ""; public string Message { get; set; } = ""; }
}
