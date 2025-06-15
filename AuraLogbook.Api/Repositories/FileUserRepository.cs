using AuraLogbook.Api.Models;
using AuraLogbook.Api.Repositories;
using Microsoft.Extensions.Options;
using System.Text.Json;

/// <summary>
/// Provides file-based storage and retrieval of user data using JSON.
/// </summary>
public class FileUserRepository : IFileUserRepository
{
    private readonly string _filePath;
    public FileUserRepository(IOptions<StorageSettings> options)
    {
        _filePath = options.Value.UserFilePath;
    }

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
        if (!File.Exists(_filePath))
        {
            return new User();
        }
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
        var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(_filePath, json);
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
            var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_filePath, json);
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
        await File.WriteAllTextAsync(_filePath, "[]");
    }


}
