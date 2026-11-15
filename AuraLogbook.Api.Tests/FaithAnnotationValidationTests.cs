using System.Security.Claims;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>#410: private text anchors must identify a segment within their selected section.</summary>
public sealed class FaithAnnotationValidationTests
{
    /// <summary>Rejects highlights and notes that omit the verse or segment identity.</summary>
    [Theory]
    [InlineData("highlight")]
    [InlineData("note")]
    public async Task Create_rejects_missing_segment_reference(string kind)
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        var result = await Controller(repository).Create(Request(kind, null));

        Assert.IsType<BadRequestObjectResult>(result);
        repository.VerifyNoOtherCalls();
    }

    /// <summary>Rejects an anchor whose verse belongs to a different book or chapter.</summary>
    [Fact]
    public async Task Create_rejects_segment_from_another_chapter()
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        var result = await Controller(repository).Create(Request("highlight", "Genesis 2:1"));

        Assert.IsType<BadRequestObjectResult>(result);
        repository.VerifyNoOtherCalls();
    }

    /// <summary>Rejects anchor hashes that are not lowercase hexadecimal SHA-256 values.</summary>
    [Theory]
    [InlineData("")]
    [InlineData("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")]
    [InlineData("xyz")]
    public async Task Create_rejects_invalid_anchor_hash(string hash)
    {
        var repository = new Mock<ISacredTextAnnotationRepository>();
        var request = Request("highlight", "Genesis 1:1");
        request.AnchorHash = hash;

        Assert.IsType<BadRequestObjectResult>(await Controller(repository).Create(request));
        repository.VerifyNoOtherCalls();
    }

    private static SacredTextAnnotationRequest Request(string kind, string? segmentReference) => new()
    {
        Framework = "christian", SectionReference = "Genesis 1", SourceVersion = "WEB:v1", Language = "en",
        Kind = kind, StartOffset = 0, EndOffset = 2, SegmentReference = segmentReference,
        AnchorHash = new string('a', 64),
        Note = kind == "note" ? "A note" : null,
    };

    private static FaithAnnotationsController Controller(Mock<ISacredTextAnnotationRepository> repository) => new(repository.Object)
    {
        ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "7")], "test")),
            },
        },
    };
}
