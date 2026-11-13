using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Services.Aura;

namespace AuraLogbook.Api.Tests;

/// <summary>Protects the palette-derived blend, decay, neutrality, and independence from pathway/onboarding choices.</summary>
public sealed class AuraEngineTests
{
    private static readonly DateOnly Today = new(2026, 7, 15); // Ordinary Time
    private static readonly IReadOnlyDictionary<string, double?> Palette = AuraTestPalette.Visible;

    private static User NewUser(SpiritualPathway pathway = SpiritualPathway.Mindfulness) =>
        new() { Id = 1, Email = "a@example.test", SelectedPathway = pathway switch
        {
            SpiritualPathway.Energy => SpiritualPathwayKeys.Energy,
            SpiritualPathway.Faith => SpiritualPathwayKeys.Faith,
            _ => SpiritualPathwayKeys.Mindfulness,
        }, OnboardingCompletedAt = "2026-07-15T00:00:00Z" };

    private static MoodEntry Entry(DateOnly date, params string[] moods) => new() { UserId = 1, Date = date, Moods = moods.ToList() };

    [Fact]
    public void Nothing_to_blend_returns_a_neutral_aura()
    {
        var aura = AuraEngine.Compute(NewUser(), [], Today, Palette);

        Assert.Null(aura.Hue);
        Assert.Equal(0, aura.Intensity);
        Assert.Empty(aura.Contributors);
    }

    [Fact]
    public void Single_mood_uses_its_visible_hue_and_existing_chroma_factor()
    {
        var aura = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Centered)], Today, Palette);

        Assert.InRange(aura.Hue!.Value, 95, 115); // Centered is visibly yellow.
        Assert.Equal(0.8, aura.Strength);
        Assert.Contains("1 check-in in the last 30 days, mostly Centered", aura.Contributors);
    }

    /// <summary>#361: the onboarding color moment no longer tints the aura; only check-ins set the hue.</summary>
    [Fact]
    public void Onboarding_color_does_not_change_a_mood_aura()
    {
        var plain = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Abundant)], Today, Palette);
        var user = NewUser();
        user.OnboardingColorHue = 265; // roughly opposite of Gold 85°
        var withColor = AuraEngine.Compute(user, [Entry(Today, MoodType.Abundant)], Today, Palette);

        Assert.Equal(plain.Hue, withColor.Hue);
        Assert.Equal(plain.Strength, withColor.Strength);
        Assert.True(withColor.Strength > 0.8);
    }

    [Fact]
    public void Neutral_mutes_strength_without_moving_the_hue()
    {
        var plain = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Visionary)], Today, Palette);
        var muted = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Visionary, MoodType.Neutral)], Today, Palette);

        Assert.Equal(plain.Hue!.Value, muted.Hue!.Value, 1);
        Assert.True(muted.Strength < plain.Strength);
    }

    [Fact]
    public void Hue_wraps_around_zero()
    {
        var aura = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Charged, MoodType.Frustrated)], Today,
            new Dictionary<string, double?> { [MoodType.Charged] = 350, [MoodType.Frustrated] = 29 }); // Synthetic wrap-around inputs protect circular averaging.

        Assert.True(aura.Hue is < 15 or > 345, $"hue was {aura.Hue}");
    }

    [Fact]
    public void Recent_visible_moods_are_independent_of_old_onboarding_color()
    {
        var user = NewUser();
        user.OnboardingCompletedAt = "2026-06-01T00:00:00Z"; // ~6 half-lives ago
        user.OnboardingColorHue = (int)AuraHueTables.Gold;
        var aura = AuraEngine.Compute(user, [Entry(Today, MoodType.Centered)], Today, Palette);

        Assert.InRange(aura.Hue!.Value, 95, 115);
    }

    [Fact]
    public void Old_moods_outside_the_window_are_ignored()
    {
        var aura = AuraEngine.Compute(NewUser(), [Entry(Today.AddDays(-31), MoodType.Charged)], Today, Palette);

        Assert.Null(aura.Hue);
    }

    /// <summary>#361: pathway choices (zodiac element, church season) no longer add a base layer.</summary>
    [Fact]
    public void Pathway_and_birthday_do_not_tint_an_empty_aura()
    {
        var energy = NewUser(SpiritualPathway.Energy);
        energy.Birthday = new DateOnly(1994, 9, 12); // Virgo, Earth
        var energyAura = AuraEngine.Compute(energy, [], Today, Palette);
        var faithAura = AuraEngine.Compute(NewUser(SpiritualPathway.Faith), [], new DateOnly(2026, 3, 1), Palette); // Lent 2026

        Assert.Null(energyAura.Hue);
        Assert.Empty(energyAura.Contributors);
        Assert.Null(faithAura.Hue);
        Assert.Empty(faithAura.Contributors);
    }

    /// <summary>#361: onboarding answers and the color moment are not listed as contributors.</summary>
    [Fact]
    public void Onboarding_answers_and_color_moment_are_not_contributors()
    {
        var user = NewUser();
        user.OnboardingAnswers = [new OnboardingAnswer { QuestionNumber = 1, Pathway = SpiritualPathway.Mindfulness }];
        user.OnboardingColorHue = 210;
        var aura = AuraEngine.Compute(user, [], Today, Palette);

        Assert.Null(aura.Hue);
        Assert.Empty(aura.Contributors);
    }

    [Theory]
    [InlineData(2024, 3, 31)]
    [InlineData(2025, 4, 20)]
    [InlineData(2026, 4, 5)]
    public void Easter_dates_match_the_calendar(int year, int month, int day) =>
        Assert.Equal(new DateOnly(year, month, day), LiturgicalSeason.Easter(year));

    [Theory]
    [InlineData("2026-11-29", "Advent")]   // first Sunday of Advent 2026
    [InlineData("2026-11-28", "Ordinary Time")]
    [InlineData("2026-12-25", "Christmas")]
    [InlineData("2027-01-03", "Christmas")]
    [InlineData("2026-05-24", "Pentecost")]
    [InlineData("2026-04-20", "Easter")]
    public void Seasons_are_placed_correctly(string date, string season) =>
        Assert.Equal(season, LiturgicalSeason.For(DateOnly.Parse(date)).Name);
}

/// <summary>Combined selections retain their individual visible colors instead of hidden authored-hue substitutions.</summary>
public sealed class AuraCombinationTests
{
    private static readonly DateOnly Today = new(2026, 7, 15);
    private static User NewUser() => new() { Id = 1, Email = "c@example.test" };

    [Fact]
    public void A_combination_of_yellow_moods_stays_yellow_and_is_named()
    {
        var entry = new MoodEntry { Date = Today, Moods = [MoodType.Centered, MoodType.Empowered] };
        var aura = AuraEngine.Compute(NewUser(), [entry], Today, AuraTestPalette.Visible);
        Assert.InRange(aura.Hue!.Value, 95, 115);
        Assert.Contains("Centered + Empowered on Wednesday", aura.Contributors);
    }

    [Fact]
    public void Unknown_historical_mappings_do_not_get_a_guessed_hue_or_throw()
    {
        var entry = new MoodEntry { Date = Today, Moods = [MoodType.Empowered, "RetiredMood"] };
        var aura = AuraEngine.Compute(NewUser(), [entry], Today, AuraTestPalette.Visible);
        Assert.InRange(aura.Hue!.Value, 95, 115);
    }
}
