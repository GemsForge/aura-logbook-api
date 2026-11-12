using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.ReferenceData;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;
using Moq;

namespace AuraLogbook.Api.Tests;

/// <summary>Guards mode defaults, Ivory conversion and preservation of unrelated account fields.</summary>
public sealed class InterfaceModeTests
{
    /// <summary>Missing and unsupported values use light while explicit dark remains intact.</summary>
    [Theory]
    [InlineData(null, "Ivory", "light")]
    [InlineData(null, "Ocean", "light")]
    [InlineData("unknown", "Ivory", "light")]
    [InlineData("dark", "Ocean", "dark")]
    [InlineData("system", "Ocean", "system")]
    [InlineData("light", "Ocean", "light")]
    public void Resolves_legacy_mode(string? value, string theme, string expected) =>
        Assert.Equal(expected, InterfaceModeValues.Resolve(value, theme));

    /// <summary>Registration persists the light default without depending on a database column default.</summary>
    [Fact]
    public async Task New_account_starts_in_light_mode()
    {
        var repository = new Mock<IFileUserRepository>();
        var reference = new Mock<IReferenceDataValidator>();
        reference.Setup(r => r.IsActivePathwayAsync(It.IsAny<string>())).ReturnsAsync(true);
        var service = new UserService(repository.Object, reference.Object);
        var result = await service.RegisterAsync(new RegisterUserRequest { Email = "light-default@example.test", Password = "AuraLightDefault359!", DisplayName = "Alex" });
        Assert.True(result.Success);
        repository.Verify(r => r.CreateAsync(It.Is<User>(u => u.InterfaceMode == "light")), Times.Once);
    }

    /// <summary>The forward migration changes only legacy Ivory's family and brightness.</summary>
    [Fact]
    public void Migration_022_preserves_other_profile_data()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        using var command = connection.CreateCommand();
        command.CommandText = "CREATE TABLE Users(Id INTEGER, InterfaceTheme TEXT, AuraColor TEXT); INSERT INTO Users VALUES(1,'Ivory','blue'),(2,'Ocean','green');";
        command.ExecuteNonQuery();
        command.CommandText = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "../../../../AuraLogbook.Api/Data/Database/Migrations/022_user_interface_mode.sql"));
        command.ExecuteNonQuery();
        command.CommandText = "SELECT InterfaceTheme,InterfaceMode,AuraColor FROM Users ORDER BY Id";
        using var reader = command.ExecuteReader();
        Assert.True(reader.Read()); Assert.Equal("Aurora", reader.GetString(0)); Assert.Equal("light", reader.GetString(1)); Assert.Equal("blue", reader.GetString(2));
        Assert.True(reader.Read()); Assert.Equal("Ocean", reader.GetString(0)); Assert.Equal("dark", reader.GetString(1)); Assert.Equal("green", reader.GetString(2));
    }

    /// <summary>JSON storage normalizes legacy Ivory on read and persists subsequent independent choices.</summary>
    [Fact]
    public async Task File_storage_preserves_legacy_ivory_and_saved_mode()
    {
        var path = Path.Combine(Path.GetTempPath(), $"aura-mode-{Guid.NewGuid():N}.json");
        try
        {
            await File.WriteAllTextAsync(path, """[{"Id":1,"Email":"alex@example.test","PasswordHash":"hash","InterfaceTheme":"Ivory","AuraColor":"blue","AuraIntensity":72}]""");
            var repository = new FileUserRepository(Options.Create(new StorageSettings { UserFilePath = path }));
            var user = (await repository.GetByIdAsync(1))!;
            Assert.Equal("Aurora", user.InterfaceTheme); Assert.Equal("light", user.InterfaceMode);
            user.InterfaceTheme = "Ocean";
            user.InterfaceMode = "system";
            Assert.True(await repository.UpdateAsync(user));
            var saved = (await repository.GetByIdAsync(1))!;
            Assert.Equal("Ocean", saved.InterfaceTheme); Assert.Equal("system", saved.InterfaceMode);
            Assert.Equal("blue", saved.AuraColor); Assert.Equal(72, saved.AuraIntensity);
        }
        finally { File.Delete(path); }
    }

    /// <summary>Partial mode/family updates retain aura, pathway, birthday, weather and reveal preferences.</summary>
    [Fact]
    public async Task Mode_and_family_updates_preserve_each_other_and_unrelated_preferences()
    {
        var user = new User { Id = 1, Email = "alex@example.test", DisplayName = "Alex", InterfaceTheme = "Ocean", InterfaceMode = "dark", AuraColor = "blue", AuraIntensity = 72,
            SelectedPathway = "Mindfulness", Birthday = new DateOnly(1994, 9, 12), TemperatureUnit = "C", AuraRevealsEnabled = false, Motto = "Keep me" };
        var repository = new Mock<IFileUserRepository>();
        repository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        repository.Setup(r => r.UpdateAsync(user)).ReturnsAsync(true);
        var reference = new Mock<IReferenceDataValidator>();
        reference.Setup(r => r.IsActivePathwayAsync(It.IsAny<string>())).ReturnsAsync(true);
        var service = new UserService(repository.Object, reference.Object);
        var mode = await service.UpdateUserAsync(new UpdateUserRequest { Id = 1, Email = user.Email, DisplayName = user.DisplayName, SelectedPathway = user.SelectedPathway, InterfaceMode = "light" });
        Assert.True(mode.Success); Assert.Equal("Ocean", user.InterfaceTheme); Assert.Equal("light", user.InterfaceMode);
        var family = await service.UpdateUserAsync(new UpdateUserRequest { Id = 1, Email = user.Email, SelectedPathway = user.SelectedPathway, InterfaceTheme = "Earth" });
        Assert.True(family.Success); Assert.Equal("Earth", user.InterfaceTheme); Assert.Equal("light", user.InterfaceMode);
        Assert.Equal("Alex", user.DisplayName); Assert.Equal("blue", user.AuraColor); Assert.Equal(72, user.AuraIntensity);
        Assert.Equal("Mindfulness", user.SelectedPathway); Assert.Equal(new DateOnly(1994,9,12), user.Birthday);
        Assert.Equal("C", user.TemperatureUnit); Assert.False(user.AuraRevealsEnabled); Assert.Equal("Keep me", user.Motto);
    }

    /// <summary>Appearance-only updates do not depend on a pathway being present or active.</summary>
    [Theory]
    [InlineData("light")]
    [InlineData("dark")]
    [InlineData("system")]
    public async Task Appearance_update_without_pathway_preserves_saved_pathway(string mode)
    {
        var user = new User { Id = 1, Email = "alex@example.test", InterfaceTheme = "Ocean", InterfaceMode = "light", SelectedPathway = "legacy-pathway" };
        var repository = new Mock<IFileUserRepository>();
        repository.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(user);
        repository.Setup(r => r.UpdateAsync(user)).ReturnsAsync(true);
        var reference = new Mock<IReferenceDataValidator>();
        var service = new UserService(repository.Object, reference.Object);

        var result = await service.UpdateUserAsync(new UpdateUserRequest
        {
            Id = 1,
            Email = user.Email,
            InterfaceMode = mode,
        });

        Assert.True(result.Success);
        Assert.Equal(mode, user.InterfaceMode);
        Assert.Equal("legacy-pathway", user.SelectedPathway);
        reference.Verify(r => r.IsActivePathwayAsync(It.IsAny<string>()), Times.Never);
        repository.Verify(r => r.UpdateAsync(user), Times.Once);
    }
}
