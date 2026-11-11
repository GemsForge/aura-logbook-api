using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models;

/// <summary>One pathway-quiz answer: which question, and the pathway its chosen card belongs to.</summary>
public sealed class OnboardingAnswer
{
    /// <summary>Number of questions in the onboarding pathway quiz.</summary>
    public const int QuestionCount = 5;

    /// <summary>Question number, 1 through <see cref="QuestionCount"/>.</summary>
    [Range(1, QuestionCount)]
    public int QuestionNumber { get; set; }

    /// <summary>The pathway the chosen answer points to.</summary>
    public SpiritualPathway Pathway { get; set; }
}
