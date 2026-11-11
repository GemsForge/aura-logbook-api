using AuraLogbook.Api.Models; // InterfaceThemeValues resolves stored theme preferences.
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services;
using AuraLogbook.Api.Services.PasswordReset;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AuraLogbook.Api.Controllers;

/// <summary>
/// Registration, login, and current-user profile endpoints.
/// </summary>
/// <remarks>
/// Every user payload returned here is a <see cref="UserProfileDto"/>; the persistence model
/// <see cref="AuraLogbook.Api.Models.User"/> is never serialized, so password hashes cannot leak.
/// Password recovery (#329) uses hashed, single-use, expiring tokens delivered by email; the
/// email-only reset removed in #327 must not return. Recovery endpoints 404 unless
/// <see cref="PasswordResetOptions.Enabled"/> is set.
/// </remarks>
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly JwtTokenService _jwtService;
    private readonly IPasswordResetService? _passwordReset;
    private readonly PasswordResetOptions _resetOptions;

    /// <summary>Generic body returned by forgot-password regardless of whether the account exists.</summary>
    public const string ForgotPasswordMessage = "If an account exists for that email, a reset link has been sent.";

    /// <summary>Single message for every unusable token (unknown, altered, expired, or already used).</summary>
    public const string InvalidResetTokenMessage = "This reset link is invalid or has expired. Please request a new one.";

    /// <summary>Generic response when a valid reset token cannot be saved to user storage.</summary>
    public const string ResetPersistenceFailureMessage = "The password could not be updated. Please request a new reset link.";

    public AuthController(IUserService userService, JwtTokenService jwtService,
        IPasswordResetService? passwordReset = null, IOptions<PasswordResetOptions>? resetOptions = null)
    {
        _userService = userService;
        _jwtService = jwtService;
        _passwordReset = passwordReset;
        _resetOptions = resetOptions?.Value ?? new PasswordResetOptions();
    }

    /// <summary>
    /// Starts account recovery. Returns 200 with <see cref="ForgotPasswordMessage"/> for known and
    /// unknown emails alike; throttled per IP (429) and silently per email.
    /// </summary>
    [HttpPost("forgot-password")]
    [EnableRateLimiting(PasswordResetRateLimit.PolicyName)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        if (!_resetOptions.Enabled || _passwordReset is null)
            return NotFound();

        await _passwordReset.RequestResetAsync(request.Email, cancellationToken);
        return Ok(new { message = ForgotPasswordMessage });
    }

    /// <summary>Redeems a reset token once and sets a new password that satisfies <see cref="PasswordRules"/>.</summary>
    [HttpPost("reset-password")]
    [EnableRateLimiting(PasswordResetRateLimit.PolicyName)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        if (!_resetOptions.Enabled || _passwordReset is null)
            return NotFound();

        return await _passwordReset.ResetPasswordAsync(request.Token, request.NewPassword, cancellationToken) switch
        {
            PasswordResetResult.Success => Ok(new { message = "Your password has been reset. You can now sign in." }),
            PasswordResetResult.InvalidPassword => BadRequest(PasswordRules.LengthMessage),
            PasswordResetResult.PersistenceFailure => StatusCode(StatusCodes.Status500InternalServerError, ResetPersistenceFailureMessage),
            _ => BadRequest(InvalidResetTokenMessage),
        };
    }

    [HttpPost("login")]
    public async Task<IActionResult> Authenticate([FromBody] AuthRequest authRequest)
    {
        var isValid = await _userService.AuthenticateAsync(authRequest.Email, authRequest.Password);
        if (!isValid)
            return Unauthorized("Invalid credentials");

        var user = await _userService.GetByEmailAsync(authRequest.Email);
        var token = _jwtService.GenerateToken(user!.Id, user!.Email, user!.DisplayName ?? string.Empty);
        return Ok(new { token });
    }


    [HttpPost("register")]
    public async Task<IActionResult> RegisterUser([FromBody] RegisterUserRequest newUser)
    {
        var result = await _userService.RegisterAsync(newUser);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

    [Authorize]
    [HttpPut("update")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest updatedUser)
    {
        if (User.Identity is not { IsAuthenticated: true })
            return Unauthorized();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)
                          ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !int.TryParse(userIdClaim.Value, out var userId))
            return BadRequest("Could not extract user ID from token.");

        updatedUser.Id = userId;
        var result = await _userService.UpdateUserAsync(updatedUser);

        if (!result.Success)
            return BadRequest(result.Message);

        // Fetch the updated user and return the same profile contract as /me.
        var fresh = await _userService.GetByIdAsync(userId);
        if (fresh is null)
            return NotFound("User not found after update.");

        return Ok(ToProfileDto(fresh));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier) ??
                          User.FindFirst(JwtRegisteredClaimNames.Sub);

        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized("Could not extract user ID from token.");

        var user = await _userService.GetByIdAsync(userId);
        if (user == null)
            return NotFound("User not found.");

        return Ok(ToProfileDto(user));
    }

    private static UserProfileDto ToProfileDto(AuraLogbook.Api.Models.User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            DisplayName = user.DisplayName ?? string.Empty,
            Birthday = user.Birthday,
            ZodiacSign = user.ZodiacSign,
            AuraColor = user.AuraColor,
            AuraIntensity = user.AuraIntensity,
            InterfaceTheme = InterfaceThemeValues.Resolve(user.InterfaceTheme),
            Avatar = user.Avatar ?? string.Empty,
            Motto = user.Motto ?? string.Empty,
            SelectedPathway = user.SelectedPathway
        };
    }
}
