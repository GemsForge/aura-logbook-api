// Models/InsightType.cs
using System.Text.Json.Serialization;

namespace AuraLogbook.Api.Models.Enums
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum InsightType
    {
        // Aries
        BoldAction,
        PauseToPlan,
        CalmFocus,

        // Taurus
        SteadyGround,
        ComfortCheck,
        ShiftFlexibility,

        // Gemini
        ClarityQuest,
        DeepListen,
        AuthenticVoice,

        // Cancer
        EmotionalCare,
        SafeSpace,
        ReleaseMemories,

        // Leo
        SpotlightBalance,
        HumbleGlow,
        HeartCourage,

        // Virgo
        HighAnalysis,
        HighService,
        PerfectionTrap,

        // Libra
        HarmonySeek,
        DecisionEase,
        PeacefulAura,

        // Scorpio
        Transformation,
        PowerRelease,
        PassionChannel,

        // Sagittarius
        AdventureCall,
        TruthQuest,
        PlayfulSpirit,

        // Capricorn
        StructureCheck,
        AmbitionBalance,
        SelfCare,

        // Aquarius
        InnovationSpark,
        CommunityFlow,
        DetachRoutine,

        // Pisces
        DreamReflection,
        EmotionalRelease,
        SpiritualAnchor
    }
}
