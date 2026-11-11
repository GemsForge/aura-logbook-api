using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Enums;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>Checks held-season transitions and the account preference on the API reveal.</summary>
public sealed class AuraControllerSeasonTests
{
    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);

    private static MoodEntry Entry(DateOnly date) => new() { UserId = 41, Date = date, Moods = [MoodType.Centered] };

    private static (AuraController Controller, Mock<IAuraSeasonRepository> Seasons) CreateController(User user, IReadOnlyList<MoodEntry> entries, AuraSeasonSpan? latest, bool reveals = true)
    {
        user.AuraRevealsEnabled = reveals;
        var users = new Mock<IFileUserRepository>();
        users.Setup(repository => repository.GetByIdAsync(41)).ReturnsAsync(user);
        var moods = new Mock<IFileMoodRepository>();
        moods.Setup(repository => repository.GetAllByUserAsync(41)).ReturnsAsync(entries.ToList());
        var combinations = new Mock<IMoodCombinationRepository>();
        combinations.Setup(repository => repository.GetHuesAsync()).ReturnsAsync(new Dictionary<string, CombinationHue>());
        var seasons = new Mock<IAuraSeasonRepository>();
        seasons.Setup(repository => repository.GetLatestAsync(41)).ReturnsAsync(latest);
        seasons.Setup(repository => repository.GetHistoryAsync(41)).ReturnsAsync(latest is null ? [] : [latest]);
        var controller = new AuraController(users.Object, moods.Object, combinations.Object, seasons.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(JwtRegisteredClaimNames.Sub, "41")], "test")),
                },
            },
        };
        return (controller, seasons);
    }

    private static List<MoodEntry> FiveCenteredDays() => Enumerable.Range(0, 5).Select(offset => Entry(Today.AddDays(-offset))).ToList();

    [Fact]
    public async Task A_held_different_key_starts_a_new_span_and_returns_pathway_copy()
    {
        var prior = new AuraSeasonSpan("harbor", new DateOnly(2026, 1, 1), null);
        var seasons = new Mock<IAuraSeasonRepository>();
        seasons.Setup(repository => repository.GetLatestAsync(41)).ReturnsAsync(prior);
        seasons.Setup(repository => repository.GetHistoryAsync(41)).ReturnsAsync([prior,
            new AuraSeasonSpan("tide", Today, null)]);
        seasons.Setup(repository => repository.StartAsync(41, "tide", Today)).Returns(Task.CompletedTask);
        var users = new Mock<IFileUserRepository>();
        users.Setup(repository => repository.GetByIdAsync(41)).ReturnsAsync(FaithUser());
        var moods = new Mock<IFileMoodRepository>();
        moods.Setup(repository => repository.GetAllByUserAsync(41)).ReturnsAsync(FiveCenteredDays());
        var combinations = new Mock<IMoodCombinationRepository>();
        var controller = new AuraController(users.Object, moods.Object, combinations.Object, seasons.Object)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(JwtRegisteredClaimNames.Sub, "41")], "test")) } },
        };

        var response = await controller.GetSeasons();
        var result = Assert.IsType<AuraSeasonResponseDto>(Assert.IsType<OkObjectResult>(response.Result).Value);

        Assert.Equal("tide", result.Current?.Key);
        Assert.Equal("Where have you felt held this week?", result.Current?.Prompt);
        seasons.Verify(repository => repository.StartAsync(41, "tide", Today), Times.Once);
    }

    [Fact]
    public async Task Disabled_reveals_return_no_copy_or_history_and_do_not_persist_transitions()
    {
        var (controller, seasons) = CreateController(new User { Id = 41, Email = "test@example.com" }, FiveCenteredDays(), null, reveals: false);

        var response = await controller.GetSeasons();
        var result = Assert.IsType<AuraSeasonResponseDto>(Assert.IsType<OkObjectResult>(response.Result).Value);

        Assert.Null(result.Current);
        Assert.Empty(result.History);
        seasons.Verify(repository => repository.GetLatestAsync(It.IsAny<int>()), Times.Never);
        seasons.Verify(repository => repository.GetHistoryAsync(It.IsAny<int>()), Times.Never);
        seasons.Verify(repository => repository.StartAsync(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<DateOnly>()), Times.Never);
    }

    [Fact]
    public async Task A_current_season_remains_current_while_the_pattern_is_shifting()
    {
        var prior = new AuraSeasonSpan("harbor", Today.AddDays(-4), null);
        var (controller, _) = CreateController(new User { Id = 41, Email = "test@example.com" }, [Entry(Today), Entry(Today.AddDays(-1))], prior);

        var response = await controller.GetSeasons();
        var result = Assert.IsType<AuraSeasonResponseDto>(Assert.IsType<OkObjectResult>(response.Result).Value);

        Assert.Equal("harbor", result.Current?.Key);
        Assert.Single(result.History);
    }

    /// <summary>
    /// A Faith user whether <c>User.SelectedPathway</c> is the enum or the string key from #354,
    /// so this test compiles before and after that change.
    /// </summary>
    private static User FaithUser()
    {
        var user = new User { Id = 41, Email = "test@example.com" };
        var property = typeof(User).GetProperty(nameof(User.SelectedPathway))!;
        property.SetValue(user, property.PropertyType == typeof(string) ? "faith" : SpiritualPathway.Faith);
        return user;
    }
}
