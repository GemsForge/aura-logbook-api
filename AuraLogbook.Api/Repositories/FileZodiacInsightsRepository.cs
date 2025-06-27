using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories.Base;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Repositories
{
    public class FileZodiacInsightsRepository : FileRepositoryBase<ZodiacSignInsights>, IFileZodiacInsightsRepository
    {
        private readonly Random _rng = new();

        public FileZodiacInsightsRepository(IOptions<StorageSettings> options) : base(options.Value.ZodiacFilePath)
        {
        }

        /// <summary>
        /// Retrieves all zodiac insights entries.
        /// </summary>
        public async Task<List<ZodiacSignInsights>> GetZodiacSignInsightsAsync()
        {
            return await ReadFromFileAsync();
        }

        /// <summary>
        /// Retrieves a single sign's insights by key (e.g. "virgo").
        /// </summary>
        public async Task<ZodiacSignInsights?> GetBySignAsync(string sign)
        {
            if (string.IsNullOrWhiteSpace(sign)) return null;
            var all = await ReadFromFileAsync();
            return all.FirstOrDefault(z => string.Equals(z.Sign, sign, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Retrieves a specific insight template by sign and type.
        /// </summary>
        public async Task<InsightTemplate?> GetInsightAsync(string sign, string type)
        {
            var section = await GetBySignAsync(sign);
            return section?.Insights.FirstOrDefault(i => string.Equals(i.Type, type, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Retrieves all insights for a given element (fire, earth, air, water).
        /// </summary>
        public async Task<IEnumerable<InsightTemplate>> GetByElementAsync(string element)
        {
            if (string.IsNullOrWhiteSpace(element))
                return Enumerable.Empty<InsightTemplate>();

            var all = await ReadFromFileAsync();
            return all
                .Where(z => string.Equals(z.Element, element, StringComparison.OrdinalIgnoreCase))
                .SelectMany(z => z.Insights);
        }

        /// <summary>
        /// Retrieves a random insight template for the specified sign.
        /// </summary>
        public async Task<InsightTemplate?> GetRandomInsightAsync(string sign)
        {
            var section = await GetBySignAsync(sign);
            if (section?.Insights == null || !section.Insights.Any())
                return null;
            var idx = _rng.Next(section.Insights.Count);
            return section.Insights[idx];
        }
    }
}
