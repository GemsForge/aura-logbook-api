using AuraLogbook.Api.Models;
using System.Text.Json;

/// <summary>
/// Provides file-based storage and retrieval of user data using JSON.
/// </summary>
public class FileUserRepository
{
    private readonly string _filePath = "Data/users.json";

    /// <summary>
    /// Retrieves all users from the JSON file.
    /// </summary>
    /// <returns>A list of users. Returns an empty list if the file does not exist.</returns>
    public async Task<List<User>> GetAllAsync()
    {
        if (!File.Exists(_filePath))
            return new List<User>();

        var json = await File.ReadAllTextAsync(_filePath);
        return JsonSerializer.Deserialize<List<User>>(json) ?? new();
    }

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email address to search for.</param>
    /// <returns>The matching user, or null if not found.</returns>
    public async Task<User?> GetByEmailAsync(string email)
    {
        var users = await GetAllAsync();
        return users.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
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
        var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(_filePath, json);
        return user.Id;
    }
}
