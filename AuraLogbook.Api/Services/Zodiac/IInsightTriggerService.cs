// Services/InsightTriggerService.cs
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;

namespace AuraLogbook.Api.Services
{
    public interface IInsightTriggerService
    {
        Task<List<InsightTemplate>> GetTriggeredInsightsAsync(
            string sign,
            MoodStatsDto stats);
    }

    public class InsightTriggerService : IInsightTriggerService
    {
        private readonly IFileZodiacInsightsRepository _zodiacRepo;

        public InsightTriggerService(IFileZodiacInsightsRepository zodiacRepo)
        {
            _zodiacRepo = zodiacRepo;
        }

        public async Task<List<InsightTemplate>> GetTriggeredInsightsAsync(
            string sign,
            MoodStatsDto stats)
        {
            var section = await _zodiacRepo.GetBySignAsync(sign);
            if (section?.Insights == null) return new();

            var total = stats.PositiveCount + stats.NegativeCount;
            var negRatio = total > 0 ? (double)stats.NegativeCount / total : 0;
            var posRatio = total > 0 ? (double)stats.PositiveCount / total : 0;
            var topMoods = stats.TopMoods;

            var results = new List<InsightTemplate>();
            foreach (var t in section.Insights)
            {
                if (ShouldTrigger(t.Type, stats, posRatio, negRatio, topMoods))
                    results.Add(t);
            }
            return results;
        }

        private bool ShouldTrigger(
            InsightType insightType,
            MoodStatsDto stats,
            double posRatio,
            double negRatio,
            IList<MoodType> topMoods)
        {
            return insightType switch
            {
                // Aries
                InsightType.BoldAction => topMoods.Any(m => m == MoodType.Restless || m == MoodType.Tense),
                InsightType.PauseToPlan => topMoods.Contains(MoodType.Charged),
                InsightType.CalmFocus => topMoods.Contains(MoodType.Scattered),

                // Taurus
                InsightType.SteadyGround => topMoods.Contains(MoodType.Scattered),
                InsightType.ComfortCheck => topMoods.Contains(MoodType.Abundant),
                InsightType.ShiftFlexibility => topMoods.Any(m => m == MoodType.Tense || m == MoodType.Frustrated),

                // Gemini
                InsightType.ClarityQuest => topMoods.Any(m => m == MoodType.Scattered || m == MoodType.Restless),
                InsightType.DeepListen => topMoods.Contains(MoodType.Scattered),
                InsightType.AuthenticVoice => topMoods.Contains(MoodType.Neutral),

                // Cancer
                InsightType.EmotionalCare => topMoods.Any(m => m == MoodType.Heavy || m == MoodType.Weary),
                InsightType.SafeSpace => topMoods.Contains(MoodType.Restless),
                InsightType.ReleaseMemories => topMoods.Contains(MoodType.Frustrated),

                // Leo
                InsightType.SpotlightBalance => topMoods.Contains(MoodType.Neutral),
                InsightType.HumbleGlow => negRatio > 0.3,
                InsightType.HeartCourage => topMoods.Contains(MoodType.Weary),

                // Virgo
                InsightType.HighAnalysis => negRatio > 0.5,
                InsightType.HighService => stats.MostFrequentMood == MoodType.Empowered,
                InsightType.PerfectionTrap => topMoods.Take(3).Contains(MoodType.Frustrated),

                // Libra
                InsightType.HarmonySeek => topMoods.Any(m => m == MoodType.Tense || m == MoodType.Frustrated),
                InsightType.DecisionEase => topMoods.Contains(MoodType.Scattered),
                InsightType.PeacefulAura => topMoods.Contains(MoodType.Heavy),

                // Scorpio
                InsightType.Transformation => negRatio > 0.4,
                InsightType.PowerRelease => topMoods.Contains(MoodType.Tense),
                InsightType.PassionChannel => topMoods.Contains(MoodType.Charged),

                // Sagittarius
                InsightType.AdventureCall => topMoods.Contains(MoodType.Weary),
                InsightType.TruthQuest => topMoods.Contains(MoodType.Disconnected),
                InsightType.PlayfulSpirit => topMoods.Contains(MoodType.Frustrated),

                // Capricorn
                InsightType.StructureCheck => topMoods.Contains(MoodType.Restless),
                InsightType.AmbitionBalance => posRatio > 0.6 && negRatio > 0.2,
                InsightType.SelfCare => topMoods.Contains(MoodType.Weary),

                // Aquarius
                InsightType.InnovationSpark => topMoods.Contains(MoodType.Visionary),
                InsightType.CommunityFlow => topMoods.Contains(MoodType.Empowered),
                InsightType.DetachRoutine => topMoods.Contains(MoodType.Tense),

                // Pisces
                InsightType.DreamReflection => topMoods.Contains(MoodType.Visionary),
                InsightType.EmotionalRelease => topMoods.Contains(MoodType.Heavy),
                InsightType.SpiritualAnchor => topMoods.Contains(MoodType.Restless),

                _ => false
            };
        }
    }
}
