using System.IdentityModel.Tokens.Jwt;
using System.Reflection;
using System.Security.Claims;
using System.Text;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Moq;

namespace AuraLogbook.Api.Tests;

public class AuthControllerTests
{
    private const string SigningKey = "test-only-signing-key-for-aura-logbook-207";
    private const string Issuer = "aura-logbook-tests";
    private const string Audience = "aura-logbook-tests";

    [Fact]
    public void GetCurrentUser_requires_bearer_authorization()
    {
        var action = typeof(AuthController).GetMethod(nameof(AuthController.GetCurrentUser));

        Assert.NotNull(action);
        Assert.NotNull(action.GetCustomAttribute<AuthorizeAttribute>());
    }

    [Fact]
    public async Task GetCurrentUser_resolves_the_subject_from_a_valid_login_token()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = SigningKey,
                ["Jwt:Issuer"] = Issuer,
                ["Jwt:Audience"] = Audience,
            })
            .Build();
        var tokenService = new JwtTokenService(config);
        var token = tokenService.GenerateToken(42, "gem@example.test", "Gem");
        var principal = new JwtSecurityTokenHandler().ValidateToken(
            token,
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = Issuer,
                ValidateAudience = true,
                ValidAudience = Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey)),
            },
            out _);

        var user = new User
        {
            Id = 42,
            Email = "gem@example.test",
            DisplayName = "Gem",
            Birthday = new DateOnly(1994, 9, 12),
            ZodiacSign = "Virgo",
            AuraColor = "green",
            AuraIntensity = 200,
        };
        var users = new Mock<IUserService>();
        users.Setup(service => service.GetByIdAsync(42)).ReturnsAsync(user);
        var controller = new AuthController(users.Object, tokenService)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal },
            },
        };

        var result = await controller.GetCurrentUser();

        var ok = Assert.IsType<OkObjectResult>(result);
        var profile = Assert.IsType<UserProfileDto>(ok.Value);
        Assert.Equal("green", profile.AuraColor);
        Assert.Equal(200, profile.AuraIntensity);
        users.Verify(service => service.GetByIdAsync(42), Times.Once);
    }
}
