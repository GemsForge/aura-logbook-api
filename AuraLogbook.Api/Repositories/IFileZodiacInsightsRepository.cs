using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories
{
    public interface IFileZodiacInsightsRepository
    {
        Task<IEnumerable<InsightTemplate>> GetByElementAsync(string element);
        Task<ZodiacSignInsights?> GetBySignAsync(string sign);
        Task<InsightTemplate?> GetInsightAsync(string sign, string type);
        Task<InsightTemplate?> GetRandomInsightAsync(string sign);
        Task<List<ZodiacSignInsights>> GetZodiacSignInsightsAsync();
    }
}