using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.ReferenceData;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>Protects validation and pathway selection for the mood interpretation endpoint.</summary>
public sealed class MoodCombinationControllerTests
{
    [Fact]
    public async Task GetInterpretation_returns_the_selected_pathway_result_for_a_valid_mood_set()
    {
        var expected = new MoodCombinationInterpretation
        {
            CombinationId = "restless-disconnected",
            Moods = ["Restless", "Disconnected"],
            PathwayKey = 1,
            Interpretation = "Pathway reflection",
        };
        var repository = new Mock<IMoodCombinationRepository>();
        var referenceData = new Mock<IReferenceDataValidator> { CallBase = true }; // CallBase runs the default ResolveActiveMoodKeysAsync.
        referenceData.Setup(x => x.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(true);
        repository.Setup(x => x.GetAsync(
                It.Is<IReadOnlyCollection<string>>(moods => moods.SequenceEqual(new[] { MoodType.Restless, MoodType.Disconnected })), 1))
            .ReturnsAsync(expected);
        var controller = new MoodCombinationController(repository.Object, referenceData.Object);

        var response = Assert.IsType<OkObjectResult>(await controller.GetInterpretation("Restless,Disconnected", 1));

        Assert.Same(expected, response.Value);
        repository.VerifyAll();
    }

    [Theory]
    [InlineData("Restless", 0)]
    [InlineData("Restless,Restless", 0)]
    [InlineData("Restless,Disconnected,Heavy,Centered", 0)]
    [InlineData("Restless,UnknownMood", 0)]
    [InlineData("Restless,Disconnected", 9)]
    public async Task GetInterpretation_rejects_invalid_moods_or_pathway(string moods, int pathwayKey)
    {
        var repository = new Mock<IMoodCombinationRepository>(MockBehavior.Strict);
        var referenceData = new Mock<IReferenceDataValidator> { CallBase = true }; // CallBase runs the default ResolveActiveMoodKeysAsync.
        referenceData.Setup(x => x.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync((IEnumerable<string> keys) => keys.All(key => key is not "UnknownMood"));
        var controller = new MoodCombinationController(repository.Object, referenceData.Object);

        var response = await controller.GetInterpretation(moods, pathwayKey);

        Assert.IsType<BadRequestObjectResult>(response);
        repository.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(0, "make room for each feeling")]
    [InlineData(1, "choose a pace or practice")]
    [InlineData(2, "spiritual practice")]
    public async Task GetInterpretation_composes_a_pathway_reflection_for_an_uncurated_mood_set(int pathwayKey, string expectedPathwayText)
    {
        var repository = new Mock<IMoodCombinationRepository>();
        var referenceData = new Mock<IReferenceDataValidator> { CallBase = true }; // CallBase runs the default ResolveActiveMoodKeysAsync.
        referenceData.Setup(x => x.AreActiveMoodsAsync(It.IsAny<IEnumerable<string>>())).ReturnsAsync(true);
        repository.Setup(x => x.GetAsync(It.IsAny<IReadOnlyCollection<string>>(), pathwayKey))
            .ReturnsAsync((MoodCombinationInterpretation?)null);
        var controller = new MoodCombinationController(repository.Object, referenceData.Object);

        var response = Assert.IsType<OkObjectResult>(await controller.GetInterpretation("Scattered,Neutral,Empowered", pathwayKey));
        var interpretation = Assert.IsType<MoodCombinationInterpretation>(response.Value);

        Assert.Equal("composed-empowered-neutral-scattered", interpretation.CombinationId);
        Assert.Equal(["Empowered", "Neutral", "Scattered"], interpretation.Moods);
        Assert.Equal(pathwayKey, interpretation.PathwayKey);
        Assert.Contains("confidence and agency", interpretation.Interpretation, StringComparison.Ordinal);
        Assert.Contains("a quieter or in-between state", interpretation.Interpretation, StringComparison.Ordinal);
        Assert.Contains("many thoughts competing for attention", interpretation.Interpretation, StringComparison.Ordinal);
        Assert.Contains(expectedPathwayText, interpretation.Interpretation, StringComparison.Ordinal);
        repository.VerifyAll();
    }
}
