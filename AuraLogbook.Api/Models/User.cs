namespace AuraLogbook.Api.Models;

/// <summary>
/// Represents a registered user in the system.
/// </summary>
public class User
{
    /// <summary>
    /// Gets or sets the unique identifier for the user.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the user's email address.
    /// </summary>
    public string Email { get; set; } = default!;

    /// <summary>
    /// Gets or sets the hashed password for the user.
    /// </summary>
    public string PasswordHash { get; set; } = default!;

    /// <summary>
    /// Gets or sets the UTC timestamp for when the user was created.
    /// </summary>
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString();

    /// <summary>
    /// Gets or sets the UTC timestamp for when the user was last updated.
    /// </summary>
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString();

    public string? DisplayName { get; set; }

    public DateOnly Birthday { get; set; }

    public string ZodiacSign { get; set; } = string.Empty;

    public string AuraColor { get; set; } = "blue";
    public int AuraIntensity { get; set; } = 500;
    public string? Avatar { get; set; }

    public string? Motto { get; set; }
    // public string Role { get; set; } = "User";
    public SpiritualPathway SelectedPathway { get; set; } = SpiritualPathway.Mindfulness;
}
