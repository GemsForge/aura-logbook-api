using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("test")]
    public async Task<IActionResult> TestConnection()
    {
        var user = await _userService.GetByEmailAsync("admin@example.com");
        return user is null ? NotFound("User not found") : Ok(user);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Authenticate([FromBody] AuthRequest authRequest)
    {
        var success = await _userService.AuthenticateAsync(authRequest.Email, authRequest.Password, (pw, hash) => pw == hash); // Temporary comparison
        return success ? Ok("Authenticated") : Unauthorized("Invalid credentials");
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterUser([FromBody] RegisterUserRequest newUser)
    {
        var result = await _userService.RegisterAsync(newUser);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

    [HttpPut("update")]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest updatedUser)
    {
        // 🔐 TODO: Extract User ID from JWT once authentication is added
        if (updatedUser.Id == 0)
        {
            return BadRequest("User ID is missing. Cannot update user without a valid identifier.");
        }

        var result = await _userService.UpdateUserAsync(updatedUser);
        return result.Success ? Ok(result.Message) : BadRequest(result.Message);
    }

}
