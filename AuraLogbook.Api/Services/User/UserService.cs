using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;

namespace AuraLogbook.Api.Services;

/// <summary>
/// Handles user-related operations and business logic.
/// </summary>
public class UserService : IUserService
{
    private readonly IFileUserRepository _userRepo;

    public UserService(IFileUserRepository userRepo)
    {
        _userRepo = userRepo;
    }

    /// <summary>
    /// Registers a new user if the email is not already taken.
    /// </summary>
    public async Task<(bool Success, string Message)> RegisterAsync(RegisterUserRequest requestuser)
    {
        var existingUser = await _userRepo.GetByEmailAsync(requestuser.Email);
        if (existingUser is not null)
            return (false, "Email is already in use.");

        var newUser = MapToUser(requestuser);
        await _userRepo.CreateAsync(newUser);
        return (true, "User registered successfully.");
    }

    /// <summary>
    /// Returns the list of all users.
    /// </summary>
    public Task<List<User>> GetAllUsersAsync() => _userRepo.GetAllAsync();

    /// <summary>
    /// Retrieves a user by email.
    /// </summary>
    public Task<User?> GetByEmailAsync(string email) => _userRepo.GetByEmailAsync(email);

    /// <summary>
    /// Retrieves a user by Id.
    /// </summary>
    public Task<User?> GetByIdAsync(int id) => _userRepo.GetByIdAsync(id);

    /// <summary>
    /// Checks if a user exists by email.
    /// </summary>
    public async Task<bool> EmailExistsAsync(string email)
    {
        var user = await _userRepo.GetByEmailAsync(email);
        return user is not null;
    }

    /// <summary>
    /// Updates user information.
    /// </summary>
    public async Task<(bool Success, string Message)> UpdateUserAsync(UpdateUserRequest request)
    {
        var existingUser = await _userRepo.GetByIdAsync(request.Id);
        if (existingUser is null)
            return (false, "User not found.");


        // Apply changes
        existingUser.Birthday = request.Birthday;
        existingUser.ZodiacSign = ZodiacHelper.GetZodiacSign(request.Birthday);
        // existingUser.ProfilePictureBlob = request.ProfilePictureBlob;
        existingUser.Email = request.Email ?? existingUser.Email;
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            existingUser.PasswordHash = PasswordHelper.HashPassword(request.Password);
        }
        existingUser.UpdatedAt = DateTime.UtcNow.ToString();

        existingUser.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
            ? existingUser.DisplayName
            : request.DisplayName;

        if (!string.IsNullOrWhiteSpace(request.AuraColor))
            existingUser.AuraColor = request.AuraColor;
        if (request.AuraIntensity.HasValue)
            existingUser.AuraIntensity = request.AuraIntensity.Value;
        if (request.Avatar is not null)
        {
            existingUser.Avatar = request.Avatar;
        }
        if (request.Motto != null)
        {
            existingUser.Motto = request.Motto.Trim();
        }

        existingUser.SelectedPathway = request.SelectedPathway;
        if (request.InterfaceTheme is not null)
            existingUser.InterfaceTheme = InterfaceThemeValues.Resolve(request.InterfaceTheme);

        // #331: only a typed place is kept. Turning location off, or switching to device
        // location, clears any saved place so nothing location-like lingers on the profile.
        if (request.WeatherLocationMode is not null)
        {
            var mode = WeatherLocationValues.ResolveMode(request.WeatherLocationMode);
            var city = WeatherLocationValues.Clean(request.WeatherCity);
            if (mode == WeatherLocationValues.City && city is null)
                return (false, "Enter a city to use for weather.");

            existingUser.WeatherLocationMode = mode;
            existingUser.WeatherCity = mode == WeatherLocationValues.City ? city : null;
            existingUser.WeatherRegion = mode == WeatherLocationValues.City ? WeatherLocationValues.Clean(request.WeatherRegion) : null;
            existingUser.WeatherCountry = mode == WeatherLocationValues.City ? WeatherLocationValues.Clean(request.WeatherCountry)?.ToUpperInvariant() : null;
        }
        if (request.TemperatureUnit is not null)
            existingUser.TemperatureUnit = WeatherLocationValues.ResolveUnit(request.TemperatureUnit);

        var updated = await _userRepo.UpdateAsync(existingUser);
        return updated ? (true, "User updated.") : (false, "Failed to update user.");
    }


    /// <summary>
    /// Deletes a user by Id.
    /// </summary>
    public async Task<(bool Success, string Message)> DeleteUserAsync(int id)
    {
        var existingUser = await _userRepo.GetByIdAsync(id);
        if (existingUser is null)
            return (false, "User not found.");

        var deleted = await _userRepo.DeleteAsync(id);
        return deleted ? (true, "User deleted.") : (false, "Failed to delete user.");
    }

    /// <summary>
    /// Gets the total number of users.
    /// </summary>
    public async Task<int> GetUserCountAsync()
    {
        var users = await _userRepo.GetAllAsync();
        return users.Count;
    }

    /// <summary>
    /// Searches users by partial email match.
    /// </summary>
    public Task<List<User>> SearchUsersAsync(string query) => _userRepo.SearchAsync(query);

    /// <summary>
    /// Authenticates a user by verifying email and password.
    /// </summary>
    public async Task<bool> AuthenticateAsync(string email, string password)
    {
        var user = await _userRepo.GetByEmailAsync(email);
        if (user is null) return false;

        return PasswordHelper.VerifyPassword(password, user.PasswordHash);
    }

    /// <summary>
    /// Deletes all users (for testing/reset purposes).
    /// </summary>
    public Task ClearAllUsersAsync() => _userRepo.ClearAsync();

    private User MapToUser(RegisterUserRequest request)
    {
        return new User
        {
            Email = request.Email,
            PasswordHash = PasswordHelper.HashPassword(request.Password), // Accepting plain password for now
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? request.Email
                : request.DisplayName,
            CreatedAt = DateTime.UtcNow.ToString(),
            Birthday = request.Birthday,
            ZodiacSign = ZodiacHelper.GetZodiacSign(request.Birthday).ToLowerInvariant(),
            AuraColor = request.AuraColor ?? "blue",
            AuraIntensity = request.AuraIntensity ?? 50,
            SelectedPathway = request.SelectedPathway
            // ProfilePictureBlob = request.ProfilePictureBlob
        };
    }

}
