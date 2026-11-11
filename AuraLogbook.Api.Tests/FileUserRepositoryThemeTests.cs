using System.Text.Json;
using AuraLogbook.Api.Models;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Tests;

/// <summary>Verifies interface-theme persistence and legacy fallback in JSON user storage.</summary>
public sealed class FileUserRepositoryThemeTests
{
    /// <summary>Uses the same Aurora fallback for missing and unsupported preference values.</summary>
    [Theory]
    [InlineData(null)]
    [InlineData("unknown")]
    public void Unsupported_theme_resolves_to_aurora(string? value)
    {
        Assert.Equal(InterfaceThemeValues.Aurora, InterfaceThemeValues.Resolve(value));
    }

    /// <summary>Reads an old JSON profile with no theme, defaults to Aurora, and saves later selections.</summary>
    [Fact]
    public async Task Legacy_user_defaults_to_aurora_and_selected_theme_survives_reload()
    {
        var filePath = Path.Combine(Path.GetTempPath(), $"aura-users-{Guid.NewGuid():N}.json");
        try
        {
            var legacyUser = new User
            {
                Id = 9,
                Email = "legacy@example.test",
                PasswordHash = "hash",
                DisplayName = "Legacy User",
                Birthday = new DateOnly(1994, 9, 12),
                ZodiacSign = "virgo",
                AuraColor = "blue",
                AuraIntensity = 50,
            };
            var oldJson = JsonSerializer.Serialize(new[] { new
            {
                legacyUser.Id,
                legacyUser.Email,
                legacyUser.PasswordHash,
                legacyUser.DisplayName,
                legacyUser.Birthday,
                legacyUser.ZodiacSign,
                legacyUser.AuraColor,
                legacyUser.AuraIntensity,
                legacyUser.Avatar,
                legacyUser.Motto,
                legacyUser.SelectedPathway,
                legacyUser.CreatedAt,
                legacyUser.UpdatedAt,
            } });
            await File.WriteAllTextAsync(filePath, oldJson);
            var repository = new FileUserRepository(Options.Create(new StorageSettings { UserFilePath = filePath }));

            var loaded = await repository.GetByIdAsync(9);
            Assert.NotNull(loaded);
            Assert.Equal(InterfaceThemeValues.Aurora, loaded.InterfaceTheme);

            loaded.InterfaceTheme = "Midnight";
            Assert.True(await repository.UpdateAsync(loaded));

            var reloaded = await repository.GetByIdAsync(9);
            Assert.Equal("Midnight", reloaded?.InterfaceTheme);
        }
        finally
        {
            if (File.Exists(filePath)) File.Delete(filePath);
        }
    }
}
