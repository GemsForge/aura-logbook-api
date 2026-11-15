using System.Security.Claims;
using System.Text.Json;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>#410: reader annotation endpoints remain authenticated, owner-scoped, and source-version bound.</summary>
public sealed class FaithAnnotationsControllerTests
{
    /// <summary>Unsupported traditions are rejected before persistence.</summary>
    [Fact]
    public async Task Create_rejects_an_unsupported_framework()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();

        var response = await Controller(repository, 7).Create(Request(framework: "custom"));

        Assert.IsType<BadRequestObjectResult>(response);
        repository.VerifyNoOtherCalls();
    }

    /// <summary>Created annotations take their owner from the authenticated token.</summary>
    [Fact]
    public async Task Create_uses_the_authenticated_user_id()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        repository.Setup(value => value.CreateAsync(It.IsAny<SacredTextAnnotation>())).ReturnsAsync(19);

        var response = await Controller(repository, 42).Create(Request());

        Assert.IsType<CreatedAtActionResult>(response);
        repository.Verify(value => value.CreateAsync(It.Is<SacredTextAnnotation>(item =>
            item.UserId == 42 && item.Framework == "christian" && item.SegmentReference == "Genesis 1:1")), Times.Once);
    }

    /// <summary>Missing authenticated identity returns 401 before any repository operation.</summary>
    [Fact]
    public async Task Missing_user_claim_returns_unauthorized_without_accessing_repository()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();

        var response = await Controller(repository).Create(Request());

        Assert.IsType<UnauthorizedResult>(response);
        repository.VerifyNoOtherCalls();
    }

    /// <summary>Lists only the caller's private annotations for the requested framework.</summary>
    [Fact]
    public async Task Get_returns_only_the_callers_rows()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        var callerRow = new SacredTextAnnotation { Id = 3, UserId = 42, Framework = "jewish" };
        repository.Setup(value => value.GetByUserAsync(42, "jewish", null)).ReturnsAsync([callerRow]);

        var response = await Controller(repository, 42).GetMine("jewish", null);

        var result = Assert.IsType<OkObjectResult>(response);
        var rows = Assert.IsType<List<SacredTextAnnotation>>(result.Value);
        Assert.Same(callerRow, Assert.Single(rows));
        repository.Verify(value => value.GetByUserAsync(42, "jewish", null), Times.Once);
    }

    /// <summary>A different user's annotation ID cannot be deleted by the caller.</summary>
    [Fact]
    public async Task Delete_on_another_users_id_returns_not_found()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        repository.Setup(value => value.DeleteAsync(42, 90)).ReturnsAsync(false);

        var response = await Controller(repository, 42).Delete(90);

        Assert.IsType<NotFoundObjectResult>(response);
        repository.Verify(value => value.DeleteAsync(42, 90), Times.Once);
    }

    /// <summary>An update for another owner's identifier returns 404 without changing the row.</summary>
    [Fact]
    public async Task Update_on_another_users_id_returns_not_found_without_updating()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        repository.Setup(value => value.GetByIdAsync(42, 90)).ReturnsAsync((SacredTextAnnotation?)null);

        var response = await Controller(repository, 42).Update(90, new SacredTextAnnotationUpdateRequest { Note = "changed" });

        Assert.IsType<NotFoundObjectResult>(response);
        repository.Verify(value => value.UpdateAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<DateTime>()), Times.Never);
    }

    /// <summary>Extra identity fields in PUT JSON have no DTO surface and cannot reach the repository update contract.</summary>
    [Fact]
    public async Task Update_request_ignores_identity_fields_and_changes_only_the_note()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        repository.Setup(value => value.GetByIdAsync(42, 90)).ReturnsAsync(new SacredTextAnnotation
        {
            Id = 90, UserId = 42, Kind = "note", Framework = "christian", SectionReference = "Genesis 1", SourceVersion = "WEB:v1",
        });
        repository.Setup(value => value.UpdateAsync(42, 90, "revised", It.IsAny<DateTime>())).ReturnsAsync(true);
        var request = JsonSerializer.Deserialize<SacredTextAnnotationUpdateRequest>(
            """{"note":"revised","framework":"jewish","sectionReference":"Exodus 2","sourceVersion":"other"}""",
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;

        var response = await Controller(repository, 42).Update(90, request);

        Assert.IsType<NoContentResult>(response);
        repository.Verify(value => value.UpdateAsync(42, 90, "revised", It.IsAny<DateTime>()), Times.Once);
    }

    private static SacredTextAnnotationRequest Request(string framework = "christian") => new()
    {
        Framework = framework,
        SectionReference = "Genesis 1",
        SourceVersion = "WEB:v1",
        Language = "en",
        Kind = "highlight",
        StartOffset = 0,
        EndOffset = 4,
        SegmentReference = "Genesis 1:1",
        AnchorHash = new string('b', 64),
    };

    private static FaithAnnotationsController Controller(Mock<ISacredTextAnnotationRepository> repository, int? userId = null)
    {
        Claim[] claims = userId is null ? [] : [new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString())];
        return new FaithAnnotationsController(repository.Object)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test")),
                },
            },
        };
    }
}
