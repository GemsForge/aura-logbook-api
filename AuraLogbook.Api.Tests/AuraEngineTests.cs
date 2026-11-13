using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Services.Aura;

namespace AuraLogbook.Api.Tests;

/// <summary>#343: the derived aura blend, decay and pathway base layer.</summary>
public sealed class AuraEngineTests
{
    private static readonly DateOnly Today = new(2026, 7, 15); // Ordinary Time

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
        var aura = AuraEngine.Compute(NewUser(), [], Today);

        Assert.Null(aura.Hue);
        Assert.Equal(0, aura.Intensity);
        Assert.Empty(aura.Contributors);
    }

    [Fact]
    public void Single_mood_sets_the_hue_and_full_strength()
    {
        var aura = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Centered)], Today);

        Assert.Equal(AuraHueTables.Blue, aura.Hue!.Value, 1);
        Assert.Contains("1 check-in in the last 30 days, mostly Centered", aura.Contributors);
    }

    /// <summary>#361: the onboarding color moment no longer tints the aura; only check-ins set the hue.</summary>
    [Fact]
    public void Onboarding_color_does_not_change_a_mood_aura()
    {
        var plain = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Abundant)], Today);
        var user = NewUser();
        user.OnboardingColorHue = 265; // roughly opposite of Gold 85°
        var withColor = AuraEngine.Compute(user, [Entry(Today, MoodType.Abundant)], Today);

        Assert.Equal(plain.Hue, withColor.Hue);
        Assert.Equal(plain.Strength, withColor.Strength);
        Assert.True(withColor.Strength > 0.8);
    }

    [Fact]
    public void Neutral_mutes_strength_without_moving_the_hue()
    {
        var plain = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Visionary)], Today);
        var muted = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Visionary, MoodType.Neutral)], Today);

        Assert.Equal(plain.Hue!.Value, muted.Hue!.Value, 1);
        Assert.True(muted.Strength < plain.Strength);
    }

    [Fact]
    public void Hue_wraps_around_zero()
    {
        var aura = AuraEngine.Compute(NewUser(), [Entry(Today, MoodType.Charged, MoodType.Frustrated)], Today); // 350° and 29°

        Assert.True(aura.Hue is < 15 or > 345, $"hue was {aura.Hue}");
    }

    [Fact]
    public void Recent_moods_outweigh_the_decayed_onboarding_seed()
    {
        var user = NewUser();
        user.OnboardingCompletedAt = "2026-06-01T00:00:00Z"; // ~6 half-lives ago
        user.OnboardingColorHue = (int)AuraHueTables.Gold;
        var aura = AuraEngine.Compute(user, [Entry(Today, MoodType.Centered)], Today);

        Assert.InRange(aura.Hue!.Value, 230, 260);
    }

    [Fact]
    public void Old_moods_outside_the_window_are_ignored()
    {
        var aura = AuraEngine.Compute(NewUser(), [Entry(Today.AddDays(-31), MoodType.Charged)], Today);

        Assert.Null(aura.Hue);
    }

    /// <summary>#361: pathway choices (zodiac element, church season) no longer add a base layer.</summary>
    [Fact]
    public void Pathway_and_birthday_do_not_tint_an_empty_aura()
    {
        var energy = NewUser(SpiritualPathway.Energy);
        energy.Birthday = new DateOnly(1994, 9, 12); // Virgo, Earth
        var energyAura = AuraEngine.Compute(energy, [], Today);
        var faithAura = AuraEngine.Compute(NewUser(SpiritualPathway.Faith), [], new DateOnly(2026, 3, 1)); // Lent 2026

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
        var aura = AuraEngine.Compute(user, [], Today);

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

/// <summary>#345: authored mood-combination hues replace the individual mood hues for an entry.</summary>
public sealed class AuraCombinationTests
{
    private static readonly DateOnly Today = new(2026, 7, 15); // a Wednesday
    private static readonly IReadOnlyDictionary<string, AuraLogbook.Api.Repositories.CombinationHue> Hues =
        new Dictionary<string, AuraLogbook.Api.Repositories.CombinationHue> { ["Tense|Visionary"] = new(330, 1.0, 1.25) };

    private static User NewUser() => new() { Id = 1, Email = "c@example.test", OnboardingCompletedAt = "2026-07-15T00:00:00Z" };

    [Fact]
    public void Matching_combination_uses_its_own_hue_and_is_named()
    {
        var entry = new MoodEntry { Date = Today, Moods = [MoodType.Visionary, MoodType.Tense] };
        var aura = AuraEngine.Compute(NewUser(), [entry], Today, Hues);

        Assert.Equal(330, aura.Hue!.Value, 1);
        Assert.Contains("Visionary + Tense on Wednesday", aura.Contributors);
    }

    [Fact]
    public void Unmatched_combination_falls_back_to_individual_moods()
    {
        var entry = new MoodEntry { Date = Today, Moods = [MoodType.Centered, MoodType.Harmonious] };
        var withTable = AuraEngine.Compute(NewUser(), [entry], Today, Hues);
        var without = AuraEngine.Compute(NewUser(), [entry], Today);

        Assert.Equal(without.Hue!.Value, withTable.Hue!.Value, 3);
        Assert.DoesNotContain(withTable.Contributors, c => c.Contains(" on "));
    }
}
