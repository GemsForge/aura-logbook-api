public enum SpiritualPathway
{
    Secular = 0,
    Mindfulness = 1,
    Astrology = 2,
    Chakra = 3,
    Christian = 4  // All Christian users share the same experience
}

public static class SpiritualPathwayDisplay
{
    private static readonly Dictionary<SpiritualPathway, string> _displayNames = new()
    {
        { SpiritualPathway.Secular, "Secular (Science-Based)" },
        { SpiritualPathway.Mindfulness, "Mindfulness" },
        { SpiritualPathway.Astrology, "Astrology" },
        { SpiritualPathway.Chakra, "Chakra (Energy Centers)" },
        { SpiritualPathway.Christian, "Christian (Bible-Based)" }
    };

    public static string GetDisplayName(SpiritualPathway pathway)
        => _displayNames.TryGetValue(pathway, out var name) ? name : pathway.ToString();
}