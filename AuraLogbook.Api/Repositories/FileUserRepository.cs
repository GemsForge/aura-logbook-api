using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Repositories.Base;
using Microsoft.Extensions.Options;
using System.Text.Json;

/// <summary>
/// Provides file-based storage and retrieval of user data using JSON.
/// </summary>
/// <remarks>
/// Users are written through <see cref="StoredUser"/> rather than <see cref="User"/> because
/// <see cref="User.PasswordHash"/> is <c>[JsonIgnore]</c> for API safety; serializing
/// <see cref="User"/> directly would silently drop every stored hash.
/// </remarks>
public class FileUserRepository : FileRepositoryBase<FileUserRepository.StoredUser>, IFileUserRepository
{
    private readonly string _filePath;
    public FileUserRepository(IOptions<StorageSettings> options) : base(options.Value.UserFilePath)
    {
        _filePath = options.Value.UserFilePath;
    }

    /// <summary>
    /// Retrieves all users from the JSON file.
    /// </summary>
    /// <returns>A list of users. Returns an empty list if the file does not exist.</returns>
    public async Task<List<User>> GetAllAsync() => (await ReadFromFileAsync()).Select(StoredUser.ToUser).ToList();

    /// <summary>Writes the given users to the JSON file, preserving password hashes.</summary>
    private Task SaveUsersAsync(List<User> users) => WriteToFileAsync(users.Select(StoredUser.FromUser).ToList());
 
    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email address to search for.</param>
    /// <returns>The matching user, or null if not found.</returns>
    public async Task<User?> GetByEmailAsync(string email)
    {
        if (!File.Exists(_filePath))
        {
            return new User();
        }
        var users = await GetAllAsync();
        return users.FirstOrDefault(u => !string.IsNullOrEmpty(u.Email) && u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Creates a new user and writes it to the JSON file.
    /// </summary>
    /// <param name="user">The user to add. The Id will be automatically assigned.</param>
    /// <returns>The Id of the newly created user.</returns>
    public async Task<int> CreateAsync(User user)
    {
        var users = await GetAllAsync();
        user.Id = users.Count > 0 ? users.Max(u => u.Id) + 1 : 1;
        users.Add(user);
        await SaveUsersAsync(users);
        return user.Id;
    }

    /// <summary>
    /// Updates an existing user by Id.
    /// </summary>
    /// <param name="user">The updated user object.</param>
    /// <returns>True if update succeeded; false if user was not found.</returns>
    public async Task<bool> UpdateAsync(User user)
    {
        var users = await GetAllAsync();
        var index = users.FindIndex(u => u.Id == user.Id);
        if (index == -1) return false;

        users[index] = user;
        await SaveUsersAsync(users);
        return true;
    }

    /// <summary>
    /// Deletes a user by Id.
    /// </summary>
    /// <param name="id">The Id of the user to delete.</param>
    /// <returns>True if deletion succeeded; false if not found.</returns>
    public async Task<bool> DeleteAsync(int id)
    {
        var users = await GetAllAsync();
        var removed = users.RemoveAll(u => u.Id == id) > 0;

        if (removed)
        {
            await SaveUsersAsync(users);
        }

        return removed;
    }

    /// <summary>
    /// Searches for users by name or email substring.
    /// </summary>
    /// <param name="query">The partial string to match.</param>
    /// <returns>A list of users matching the query.</returns>
    public async Task<List<User>> SearchAsync(string query)
    {
        var users = await GetAllAsync();
        return users
            .Where(u =>
                (!string.IsNullOrEmpty(u.Email) && u.Email.Contains(query, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(u.DisplayName) && u.DisplayName.Contains(query, StringComparison.OrdinalIgnoreCase)))
            .ToList();
    }

    /// <summary>
    /// Retrieves a user by their Id.
    /// </summary>
    /// <param name="id">The Id of the user to retrieve.</param>
    /// <returns>The user, or null if not found.</returns>
    public async Task<User?> GetByIdAsync(int id)
    {
        var users = await GetAllAsync();
        return users.FirstOrDefault(u => u.Id == id);
    }

    /// <summary>
    /// Deletes all users from the JSON file.
    /// </summary>
    public async Task ClearAsync()
    {
        await SaveUsersAsync(new List<User>());
    }

    /// <summary>
    /// On-disk shape of a user. Mirrors <see cref="User"/> property names so existing user files
    /// load unchanged, and serializes <see cref="PasswordHash"/>, which <see cref="User"/> hides.
    /// </summary>
    public sealed class StoredUser
    {
        public int Id { get; set; }
        public string Email { get; set; } = default!;
        public string PasswordHash { get; set; } = default!;
        public string CreatedAt { get; set; } = DateTime.UtcNow.ToString();
        public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString();
        public string? DisplayName { get; set; }
        public DateOnly Birthday { get; set; }
        public string ZodiacSign { get; set; } = string.Empty;
        public string AuraColor { get; set; } = "blue";
        public int AuraIntensity { get; set; } = 50;
        public string? Avatar { get; set; }
        public string? Motto { get; set; }
        public SpiritualPathway SelectedPathway { get; set; } = SpiritualPathway.Mindfulness;

        /// <summary>Copies a domain user into its storage shape.</summary>
        public static StoredUser FromUser(User u) => new()
        {
            Id = u.Id, Email = u.Email, PasswordHash = u.PasswordHash, CreatedAt = u.CreatedAt, UpdatedAt = u.UpdatedAt,
            DisplayName = u.DisplayName, Birthday = u.Birthday, ZodiacSign = u.ZodiacSign, AuraColor = u.AuraColor,
            AuraIntensity = u.AuraIntensity, Avatar = u.Avatar, Motto = u.Motto, SelectedPathway = u.SelectedPathway,
        };

        /// <summary>Copies a stored record back into the domain user.</summary>
        public static User ToUser(StoredUser s) => new()
        {
            Id = s.Id, Email = s.Email, PasswordHash = s.PasswordHash, CreatedAt = s.CreatedAt, UpdatedAt = s.UpdatedAt,
            DisplayName = s.DisplayName, Birthday = s.Birthday, ZodiacSign = s.ZodiacSign, AuraColor = s.AuraColor,
            AuraIntensity = s.AuraIntensity, Avatar = s.Avatar, Motto = s.Motto, SelectedPathway = s.SelectedPathway,
        };
    }
}
