using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto;

/// <summary>
/// Completes onboarding for the signed-in user (#341): the pathway Alex settled on, plus the
/// optional inputs gathered by the quiz. Scoring happens on the client; the server validates
/// and stores the result.
/// </summary>
public sealed class OnboardingRequest
{
    /// <summary>The chosen pathway. Skipping the quiz sends Mindfulness.</summary>
    public SpiritualPathway SelectedPathway { get; set; } = SpiritualPathway.Mindfulness;

    /// <summary>Optional birthday from the quiz's last card; used only for zodiac-based content.</summary>
    public DateOnly? Birthday { get; set; }

    /// <summary>Quiz answers, at most one per question (1-5). Empty when the quiz was skipped.</summary>
    [MaxLength(OnboardingAnswer.QuestionCount)]
    public List<OnboardingAnswer> Answers { get; set; } = [];

    /// <summary>Optional hue (0-359) from the color moment; an input to the aura, not a chosen color.</summary>
    [Range(0, 359)]
    public int? ColorMomentHue { get; set; }

    /// <summary>Optional choices from the pathway page; must belong to <see cref="SelectedPathway"/>.</summary>
    public PathwayPreferences? PathwayPreferences { get; set; }
}
