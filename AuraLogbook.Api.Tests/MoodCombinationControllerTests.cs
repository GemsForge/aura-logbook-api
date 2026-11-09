using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Repositories;
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
        repository.Setup(x => x.GetAsync(
                It.Is<IReadOnlyCollection<MoodType>>(moods => moods.SequenceEqual(new[] { MoodType.Restless, MoodType.Disconnected })), 1))
            .ReturnsAsync(expected);
        var controller = new MoodCombinationController(repository.Object);

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
        var controller = new MoodCombinationController(repository.Object);

        var response = await controller.GetInterpretation(moods, pathwayKey);

        Assert.IsType<BadRequestObjectResult>(response);
        repository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetInterpretation_returns_no_content_for_an_unsupported_combination()
    {
        var repository = new Mock<IMoodCombinationRepository>();
        repository.Setup(x => x.GetAsync(It.IsAny<IReadOnlyCollection<MoodType>>(), 0))
            .ReturnsAsync((MoodCombinationInterpretation?)null);
        var controller = new MoodCombinationController(repository.Object);

        var response = await controller.GetInterpretation("Restless,Disconnected", 0);

        Assert.IsType<NoContentResult>(response);
        repository.VerifyAll();
    }
}
