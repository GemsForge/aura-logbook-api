using AuraLogbook.Api.Services.Aura;

namespace AuraLogbook.Api.Tests;

/// <summary>#346: season keys appear only when the recent daily pattern holds.</summary>
public sealed class AuraSeasonsTests
{
    [Fact]
    public void Five_matching_days_and_four_logs_hold_a_season()
    {
        Assert.Equal("tide", AuraSeasons.Holding(["tide", "tide", "tide", "tide", "tide", "harbor", null], 4));
    }

    [Fact]
    public void A_broken_pattern_or_too_few_logs_stays_shifting()
    {
        Assert.Null(AuraSeasons.Holding(["tide", "tide", "tide", "tide", "harbor", "harbor", null], 4));
        Assert.Null(AuraSeasons.Holding(["tide", "tide", "tide", "tide", "tide", null, null], 3));
    }

    [Theory]
    [InlineData(null, 1, null)]
    [InlineData(250d, 0.7, "tide")]
    [InlineData(250d, 0.3, "harbor")]
    [InlineData(100d, 0.7, "harvest")]
    [InlineData(10d, 0.7, "kindling")]
    [InlineData(10d, 0.3, "weather")]
    [InlineData(200d, 0.1, "stillwater")]
    public void Daily_hue_and_strength_map_to_expected_key(double? hue, double strength, string? expected) =>
        Assert.Equal(expected, AuraSeasons.KeyFor(hue, strength));
}
