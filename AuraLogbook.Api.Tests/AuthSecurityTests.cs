using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using AuraLogbook.Api.Controllers;
using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>
/// Regression coverage for #327: no unauthenticated password reset, no password hashes in API
/// JSON, and 8–72 character rules for new passwords without breaking legacy logins.
/// </summary>
public class AuthSecurityTests
{
    /// <summary>Same serializer settings as Program.cs AddJsonOptions (web defaults + string enums).</summary>
    private static readonly JsonSerializerOptions ApiJson = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
    };

    private static IEnumerable<string> AuthRouteTemplates() =>
        typeof(AuthController).GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)
            .SelectMany(m => m.GetCustomAttributes<HttpMethodAttribute>())
            .Select(a => a.Template ?? string.Empty);

    [Theory]
    [InlineData("test")]
    [InlineData("all")]
    public void Removed_auth_routes_are_not_mapped(string template)
    {
        // An unmapped route returns 404 from routing, so the old reset request cannot reach any code.
        Assert.DoesNotContain(template, AuthRouteTemplates(), StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void Email_only_password_update_no_longer_exists_on_the_service()
    {
        Assert.Null(typeof(IUserService).GetMethod("UpdatePasswordByEmailAsync"));
        Assert.Null(typeof(AuthController).Assembly.GetType("AuraLogbook.Api.Models.Dto.UpdatePasswordRequest"));
    }

    [Fact]
    public void Remaining_auth_routes_are_the_expected_set()
    {
        Assert.Equal(
            new[] { "forgot-password", "login", "me", "register", "reset-password", "update" },
            AuthRouteTemplates().OrderBy(t => t).ToArray());
    }

    [Fact]
    public void Serialized_user_never_contains_password_hash()
    {
        var user = new User { Id = 1, Email = "a@example.test", PasswordHash = "$2a$11$secret-hash-value" };

        var json = JsonSerializer.Serialize(user, ApiJson);

        Assert.DoesNotContain("passwordHash", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("secret-hash-value", json);
    }

    [Fact]
    public async Task Me_and_update_responses_serialize_without_password_hash()
    {
        var user = new User { Id = 5, Email = "me@example.test", PasswordHash = "$2a$11$secret-hash-value", DisplayName = "Me" };
        var users = new Mock<IUserService>();
        users.Setup(s => s.GetByIdAsync(5)).ReturnsAsync(user);
        users.Setup(s => s.UpdateUserAsync(It.IsAny<UpdateUserRequest>())).ReturnsAsync((true, "User updated."));
        var controller = ControllerFor(users, userId: 5);

        foreach (var result in new[] { await controller.GetCurrentUser(), await controller.UpdateUser(new UpdateUserRequest { Email = "me@example.test" }) })
        {
            var ok = Assert.IsType<OkObjectResult>(result);
            var json = JsonSerializer.Serialize(ok.Value, ApiJson);
            Assert.DoesNotContain("passwordHash", json, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("secret-hash-value", json);
        }
    }

    [Theory]
    [InlineData(7, false)]
    [InlineData(8, true)]
    [InlineData(72, true)]
    [InlineData(73, false)]
    public void Register_enforces_8_to_72_characters(int length, bool valid)
    {
        var request = new RegisterUserRequest
        {
            Email = "new@example.test",
            Password = new string('a', length),
            Birthday = new DateOnly(1990, 1, 1),
        };

        Assert.Equal(valid, IsValid(request));
    }

    [Theory]
    [InlineData(7, false)]
    [InlineData(8, true)]
    [InlineData(73, false)]
    public void Authenticated_update_enforces_8_to_72_characters(int length, bool valid)
    {
        var request = new UpdateUserRequest { Id = 1, Email = "me@example.test", Password = new string('a', length) };

        Assert.Equal(valid, IsValid(request));
    }

    [Fact]
    public void Update_without_a_password_change_stays_valid()
    {
        Assert.True(IsValid(new UpdateUserRequest { Id = 1, Email = "me@example.test", Password = null }));
    }

    [Fact]
    public void Login_still_accepts_a_legacy_six_character_password()
    {
        Assert.True(IsValid(new AuthRequest { Email = "old@example.test", Password = "abc123" }));
    }

    [Fact]
    public async Task Six_character_legacy_account_can_still_authenticate()
    {
        var stored = new User { Id = 3, Email = "old@example.test", PasswordHash = BCrypt.Net.BCrypt.HashPassword("abc123") };
        var repo = new Mock<Repositories.IFileUserRepository>();
        repo.Setup(r => r.GetByEmailAsync("old@example.test")).ReturnsAsync(stored);

        Assert.True(await new UserService(repo.Object).AuthenticateAsync("old@example.test", "abc123"));
    }

    [Fact]
    public void Update_requires_bearer_authorization()
    {
        var action = typeof(AuthController).GetMethod(nameof(AuthController.UpdateUser));
        Assert.NotNull(action!.GetCustomAttribute<AuthorizeAttribute>());
    }

    [Fact]
    public async Task Update_changes_only_the_token_subject_even_if_the_body_names_another_user()
    {
        var users = new Mock<IUserService>();
        UpdateUserRequest? captured = null;
        users.Setup(s => s.UpdateUserAsync(It.IsAny<UpdateUserRequest>()))
            .Callback<UpdateUserRequest>(r => captured = r)
            .ReturnsAsync((true, "User updated."));
        users.Setup(s => s.GetByIdAsync(5)).ReturnsAsync(new User { Id = 5, Email = "me@example.test", PasswordHash = "x" });

        await ControllerFor(users, userId: 5).UpdateUser(new UpdateUserRequest { Id = 99, Email = "me@example.test", Password = "NewPassword1" });

        Assert.NotNull(captured);
        Assert.Equal(5, captured!.Id);
    }

    [Fact]
    public async Task Update_rejects_an_unauthenticated_principal()
    {
        var users = new Mock<IUserService>();
        var controller = new AuthController(users.Object, null!)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

        var result = await controller.UpdateUser(new UpdateUserRequest { Email = "x@example.test", Password = "NewPassword1" });

        Assert.IsType<UnauthorizedResult>(result);
        users.Verify(s => s.UpdateUserAsync(It.IsAny<UpdateUserRequest>()), Times.Never);
    }

    [Fact]
    public async Task File_backed_users_keep_their_hash_and_can_log_in()
    {
        var path = Path.Combine(Path.GetTempPath(), $"aura-users-{Guid.NewGuid():N}.json");
        // Start from an empty store: a missing file makes GetByEmailAsync return an empty User
        // (pre-existing behavior, reported separately), which blocks the first registration.
        await File.WriteAllTextAsync(path, "[]");
        try
        {
            var repo = new FileUserRepository(Options.Create(new StorageSettings { UserFilePath = path }));
            var service = new UserService(repo);
            var registered = await service.RegisterAsync(new RegisterUserRequest
            {
                Email = "file@example.test",
                Password = "Password123!",
                Birthday = new DateOnly(1990, 1, 1),
            });
            Assert.True(registered.Success);

            // The hash must reach disk despite [JsonIgnore] on User.PasswordHash.
            using var document = JsonDocument.Parse(await File.ReadAllTextAsync(path));
            var hash = document.RootElement[0].GetProperty("PasswordHash").GetString();
            Assert.StartsWith("$2", hash);

            // A fresh repository instance proves the hash round-trips from the file.
            var reloaded = new UserService(new FileUserRepository(Options.Create(new StorageSettings { UserFilePath = path })));
            Assert.True(await reloaded.AuthenticateAsync("file@example.test", "Password123!"));
            Assert.False(await reloaded.AuthenticateAsync("file@example.test", "wrong-password"));
        }
        finally
        {
            File.Delete(path);
        }
    }

    private static AuthController ControllerFor(Mock<IUserService> users, int userId) =>
        new(users.Object, null!)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, userId.ToString())], "Bearer")),
                },
            },
        };

    private static bool IsValid(object model) =>
        Validator.TryValidateObject(model, new ValidationContext(model), new List<ValidationResult>(), validateAllProperties: true);
}
