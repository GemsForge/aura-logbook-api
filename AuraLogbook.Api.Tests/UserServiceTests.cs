using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using Moq;

namespace AuraLogbook.Api.Tests;

public class UserServiceTests
{
    [Fact]
    public async Task RegisterAsync_rejects_duplicate_email()
    {
        var repo = new Mock<IFileUserRepository>();
        repo.Setup(r => r.GetByEmailAsync("existing@example.com"))
            .ReturnsAsync(new User { Id = 1, Email = "existing@example.com" });

        var result = await new UserService(repo.Object).RegisterAsync(new RegisterUserRequest
        {
            Email = "existing@example.com",
            Password = "Password123!"
        });

        Assert.False(result.Success);
        Assert.Equal("Email is already in use.", result.Message);
        repo.Verify(r => r.CreateAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task AuthenticateAsync_verifies_registered_password()
    {
        var repo = new Mock<IFileUserRepository>();
        var service = new UserService(repo.Object);
        await service.RegisterAsync(new RegisterUserRequest
        {
            Email = "user@example.com",
            Password = "Password123!"
        });
        var created = repo.Invocations.Single(i => i.Method.Name == nameof(IFileUserRepository.CreateAsync))
            .Arguments[0] as User;
        repo.Setup(r => r.GetByEmailAsync("user@example.com")).ReturnsAsync(created);

        Assert.True(await service.AuthenticateAsync("user@example.com", "Password123!"));
        Assert.False(await service.AuthenticateAsync("user@example.com", "wrong-password"));
    }
}
