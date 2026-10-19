using System.Security.Claims;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AuraLogbook.Api.Tests;

public sealed class ReflectionControllerTests
{
    [Fact]
    public void Reflection_routes_require_bearer_authorization()
    {
        Assert.NotNull(typeof(ReflectionController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true).SingleOrDefault());
    }

    [Fact]
    public async Task Create_response_uses_the_authenticated_user_and_returns_created_resource()
    {
        var repository = new Mock<IReflectionRepository>();
        var response = new ReflectionResponse
        {
            Id = 12,
            PromptId = 3,
            MoodEntryId = 44,
            ResponseText = "I noticed steadiness.",
        };
        repository.Setup(value => value.CreateResponseAsync(7, 3, 44, "I noticed steadiness."))
            .ReturnsAsync(response);
        var controller = CreateController(repository, new Claim(ClaimTypes.NameIdentifier, "7"));

        var result = await controller.CreateResponse(new CreateReflectionResponseRequest
        {
            PromptId = 3,
            MoodEntryId = 44,
            ResponseText = "I noticed steadiness.",
        });

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(ReflectionController.GetResponse), created.ActionName);
        Assert.Equal(12, created.RouteValues!["id"]);
        repository.Verify(value => value.CreateResponseAsync(7, 3, 44, "I noticed steadiness."), Times.Once);
    }

    [Fact]
    public async Task Missing_user_claim_returns_unauthorized_without_accessing_repository()
    {
        var repository = new Mock<IReflectionRepository>();
        var controller = CreateController(repository);

        var result = await controller.GetResponses(null);

        Assert.IsType<UnauthorizedResult>(result);
        repository.VerifyNoOtherCalls();
    }

    private static ReflectionController CreateController(Mock<IReflectionRepository> repository, params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, "test");
        return new ReflectionController(repository.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) },
            },
        };
    }
}
