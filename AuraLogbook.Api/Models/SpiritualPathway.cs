namespace AuraLogbook.Api.Models;

/// <summary>Internal pathway categories used by onboarding and Aura interpretation rules.</summary>
public enum SpiritualPathway
{
    Mindfulness,
    Energy,
    Faith
}

/// <summary>Stable database and client keys for pathway definitions.</summary>
public static class SpiritualPathwayKeys
{
    public const string Mindfulness = "mindfulness";
    public const string Energy = "energy";
    public const string Faith = "faith";
}
