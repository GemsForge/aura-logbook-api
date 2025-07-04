using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace AuraLogbook.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly JwtTokenService _jwtService;

    public AuthController(IUserService userService, JwtTokenService jwtService)
    {
        _userService = userService;
        _jwtService = jwtService;
    }

    [HttpGet("test")]
    public async Task<IActionResult> TestConnection()
    {
        var user = await _userService.GetByEmailAsync("admin@example.com");
        return user is null ? NotFound("User not found") : Ok(user);
    }

    [Authorize]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Authenticate([FromBody] AuthRequest authRequest)
    {
        var isValid = await _userService.AuthenticateAsync(authRequest.Email, authRequest.Password);
        if (!isValid)
            return Unauthorized("Invalid credentials");

        var user = await _userService.GetByEmailAsync(authRequest.Email);
        var token = _jwtService.GenerateToken(user!.Id, user!.Email, user!.DisplayName);
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

        // Fetch the updated user and map to your DTO
        var fresh = await _userService.GetByIdAsync(userId);
        // 2) Map to your DTO
        var dto = new UserProfileDto
        {
            Id = fresh.Id,
            Email = fresh.Email,
            DisplayName = fresh.DisplayName ?? string.Empty,
            ZodiacSign = fresh.ZodiacSign,                // may be null
            Birthday = fresh.Birthday,                  // DateOnly → DateOnly
            AuraColor = fresh.AuraColor,                 // string → string
            AuraIntensity = fresh.AuraIntensity,  // int → string (match your DTO)
            Avatar = fresh.Avatar ?? string.Empty,
            Motto = fresh.Motto ?? string.Empty,
            SpiritualPathways = fresh.SpiritualPathways?.ToList()
        };
        return Ok(dto);
    }

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

        return Ok(new
        {
            user.Id,
            user.Email,
            user.DisplayName,
            user.Birthday,
            user.ZodiacSign,
            user.AuraColor,
            user.AuraIntensity,
            user.Avatar,
            user.Motto,
            user.SpiritualPathways
        });
    }
}
