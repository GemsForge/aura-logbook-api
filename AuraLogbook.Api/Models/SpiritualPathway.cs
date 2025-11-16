public enum SpiritualPathway
{
    Mindfulness,
    Energy,
    Faith 
}

public static class SpiritualPathwayDisplay
{
    private static readonly Dictionary<SpiritualPathway, string> _displayNames = new()
{
    { SpiritualPathway.Mindfulness, "Mindful Living" },
    { SpiritualPathway.Energy, "Astrology & Energy" },
    { SpiritualPathway.Faith, "Christian Faith" }
};


    public static string GetDisplayName(SpiritualPathway pathway)
        => _displayNames.TryGetValue(pathway, out var name) ? name : pathway.ToString();
}