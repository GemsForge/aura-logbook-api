using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using AuraLogbook.Api.Services.ReferenceData;

namespace AuraLogbook.Api.Services;

/// <summary>
/// Handles user-related operations and business logic.
/// </summary>
public class UserService : IUserService
{
    private readonly IFileUserRepository _userRepo;
    private readonly IReferenceDataValidator _referenceData;

    public UserService(IFileUserRepository userRepo, IReferenceDataValidator referenceData)
    {
        _userRepo = userRepo;
        _referenceData = referenceData;
    }

    /// <summary>
    /// Registers a new user if the email is not already taken.
    /// </summary>
    public async Task<(bool Success, string Message)> RegisterAsync(RegisterUserRequest requestuser)
    {
        var selectedPathway = requestuser.SelectedPathway ?? SpiritualPathwayKeys.Mindfulness;
        if (!await _referenceData.IsActivePathwayAsync(selectedPathway))
            return (false, "Select an active pathway.");
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
    /// Updates user information while preserving optional values omitted by focused account updates.
    /// </summary>
    public async Task<(bool Success, string Message)> UpdateUserAsync(UpdateUserRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.SelectedPathway) &&
            !await _referenceData.IsActivePathwayAsync(request.SelectedPathway))
            return (false, "Select an active pathway.");
        if (request.AuraColor is not null && !await _referenceData.IsActiveAuraAsync(request.AuraColor))
            return (false, "Select an active aura color.");
        var existingUser = await _userRepo.GetByIdAsync(request.Id);
        if (existingUser is null)
            return (false, "User not found.");
        // #385: modules are validated against the pathway they will be saved with: the requested one,
        // or the saved one when this update leaves the pathway unchanged.
        if (request.PathwayPreferences is not null)
        {
            var effectivePathway = string.IsNullOrWhiteSpace(request.SelectedPathway) ? existingUser.SelectedPathway : request.SelectedPathway;
            var preferenceError = request.PathwayPreferences.Validate(PathwayKeyToEnum(effectivePathway));
            if (preferenceError is not null) return (false, preferenceError);
        }

        // Validate optional chart details against the pathway that will remain saved after this update.
        if (request.PathwayPreferences is not null)
        {
            var pathwayKey = string.IsNullOrWhiteSpace(request.SelectedPathway) ? existingUser.SelectedPathway : request.SelectedPathway;
            var pathway = pathwayKey switch
            {
                SpiritualPathwayKeys.Energy => SpiritualPathway.Energy,
                SpiritualPathwayKeys.Faith => SpiritualPathway.Faith,
                _ => SpiritualPathway.Mindfulness,
            };
            var preferenceError = request.PathwayPreferences.Validate(pathway);
            if (preferenceError is not null) return (false, preferenceError);
        }


        // Apply changes. Birthday is optional (#341); omitting it keeps the saved one.
        if (request.Birthday is { } birthday)
        {
            existingUser.Birthday = birthday;
            existingUser.ZodiacSign = ZodiacHelper.GetZodiacSign(birthday);
        }
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

        if (!string.IsNullOrWhiteSpace(request.SelectedPathway))
            existingUser.SelectedPathway = request.SelectedPathway;
        if (request.PathwayPreferences is not null)
            existingUser.PathwayPreferences = request.PathwayPreferences;
        // Normalize a legacy appearance once; subsequent family changes preserve the current mode.
        existingUser.InterfaceMode = InterfaceModeValues.Resolve(existingUser.InterfaceMode, existingUser.InterfaceTheme);
        existingUser.InterfaceTheme = InterfaceThemeValues.Resolve(existingUser.InterfaceTheme);
        if (request.InterfaceTheme is not null)
        {
            existingUser.InterfaceTheme = InterfaceThemeValues.Resolve(request.InterfaceTheme);
            if (request.InterfaceTheme == "Ivory") existingUser.InterfaceMode = "light";
        }
        if (request.InterfaceMode is not null)
            existingUser.InterfaceMode = InterfaceModeValues.Resolve(request.InterfaceMode);

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
        if (request.AuraRevealsEnabled is { } revealsEnabled)
            existingUser.AuraRevealsEnabled = revealsEnabled;
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

    /// <summary>
    /// Completes onboarding for <paramref name="userId"/> (#341): saves the pathway, the optional
    /// birthday and color-moment hue, and the quiz answers, then stamps
    /// <see cref="User.OnboardingCompletedAt"/>. Calling it again replaces the previous answers.
    /// </summary>
    /// <returns>Success, or a validation message for unknown pathways, duplicate or out-of-range
    /// questions, future birthdays, pathway-page choices that don't fit the pathway, or a missing user.</returns>
    public async Task<(bool Success, string Message)> CompleteOnboardingAsync(int userId, OnboardingRequest request)
    {
        var error = ValidateOnboarding(request);
        if (error is not null) return (false, error);
        if (!await _referenceData.IsActivePathwayAsync(PathwayKeyFor(request.SelectedPathway)))
            return (false, "Choose an active pathway.");

        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null) return (false, "User not found.");

        user.SelectedPathway = PathwayKeyFor(request.SelectedPathway);
        if (request.Birthday is { } birthday)
        {
            user.Birthday = birthday;
            user.ZodiacSign = ZodiacHelper.GetZodiacSign(birthday);
        }
        user.OnboardingColorHue = request.ColorMomentHue;
        user.OnboardingAnswers = request.Answers.OrderBy(a => a.QuestionNumber).ToList();
        user.PathwayPreferences = request.PathwayPreferences;
        var now = DateTime.UtcNow.ToString("O", System.Globalization.CultureInfo.InvariantCulture);
        user.OnboardingCompletedAt = now;
        user.UpdatedAt = now;

        var updated = await _userRepo.UpdateAsync(user);
        return updated ? (true, "Onboarding completed.") : (false, "Failed to save onboarding.");
    }

    /// <summary>Returns a user-facing validation message, or null when the request is valid.</summary>
    private static string? ValidateOnboarding(OnboardingRequest request)
    {
        // JSON null overrides the "= []" initializer; treat a null list as a skipped quiz.
        request.Answers ??= [];
        if (request.Answers.Any(a => a is null))
            return "Quiz answers cannot be empty.";
        // Enum binding accepts any integer, so unknown pathways are rejected here.
        if (!Enum.IsDefined(request.SelectedPathway))
            return "Choose a supported pathway.";
        if (request.Birthday is { } birthday && birthday > DateOnly.FromDateTime(DateTime.UtcNow))
            return "Birthday cannot be in the future.";
        if (request.ColorMomentHue is < 0 or > 359)
            return "Color hue must be between 0 and 359.";
        if (request.Answers.Count > OnboardingAnswer.QuestionCount)
            return "Too many quiz answers.";
        foreach (var answer in request.Answers)
        {
            if (answer.QuestionNumber is < 1 or > OnboardingAnswer.QuestionCount)
                return "Quiz answers must reference questions 1 to 5.";
            if (!Enum.IsDefined(answer.Pathway))
                return "Quiz answers must reference a supported pathway.";
        }
        if (request.Answers.Select(a => a.QuestionNumber).Distinct().Count() != request.Answers.Count)
            return "Each quiz question can be answered only once.";
        return request.PathwayPreferences?.Validate(request.SelectedPathway);
    }

    /// <summary>Maps an onboarding pathway category to its stable database key.</summary>
    private static string PathwayKeyFor(SpiritualPathway pathway) => pathway switch
    {
        SpiritualPathway.Energy => SpiritualPathwayKeys.Energy,
        SpiritualPathway.Faith => SpiritualPathwayKeys.Faith,
        _ => SpiritualPathwayKeys.Mindfulness,
    };

    /// <summary>Maps a validated stable pathway key to its internal category for module validation.</summary>
    private static SpiritualPathway PathwayKeyToEnum(string? pathway) => pathway switch
    {
        SpiritualPathwayKeys.Energy => SpiritualPathway.Energy,
        SpiritualPathwayKeys.Faith => SpiritualPathway.Faith,
        _ => SpiritualPathway.Mindfulness,
    };

    /// <summary>
    /// Builds a new user from a short registration (#341). Birthday and pathway are optional; the
    /// aura starts from defaults because it is derived later, not chosen. A legacy client that still
    /// sends a pathway at registration is treated as already onboarded so it is not sent to the quiz.
    /// </summary>
    private User MapToUser(RegisterUserRequest request)
    {
        var now = DateTime.UtcNow.ToString();
        return new User
        {
            Email = request.Email,
            PasswordHash = PasswordHelper.HashPassword(request.Password), // Accepting plain password for now
            DisplayName = string.IsNullOrWhiteSpace(request.DisplayName)
                ? request.Email
                : request.DisplayName,
            CreatedAt = now,
            Birthday = request.Birthday,
            ZodiacSign = request.Birthday is { } birthday
                ? ZodiacHelper.GetZodiacSign(birthday).ToLowerInvariant()
                : string.Empty,
            SelectedPathway = request.SelectedPathway ?? SpiritualPathwayKeys.Mindfulness,
            OnboardingCompletedAt = request.SelectedPathway is null ? null : now,
        };
    }

}
