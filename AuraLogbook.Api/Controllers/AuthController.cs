using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;
using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AuraLogbook.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly FileUserRepository _users;
        private readonly UserRepository _userRepository;

        public AuthController(FileUserRepository users, UserRepository userRepository)
        {
            _users = users;
            _userRepository = userRepository;
        }

        [HttpGet("test")]
        public async Task<IActionResult> TestConnection()
        {
            var testUser = await _users.GetByEmailAsync("admin@example.com");
            if (testUser is null)
                return NotFound("User not found");

            return Ok(testUser);
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _users.GetAllAsync();
            return Ok(users);
        }

        [HttpGet("all-database")]
        public async Task<IActionResult> GetAllDbUsers()
        {
            var users = await _userRepository.GetAllAsync();
            return Ok(users);
        }

        [HttpGet]
        public async Task<IActionResult> GetUser(AuthRequest authUser)
        {
            var user = await _users.GetByEmailAsync(authUser.Email);
            return Ok(user);
        }


        [HttpPost("create")]
        public async Task<IActionResult> CreateNewUser(RegisterUserRequest user)
        {
            var existingUser = await _users.GetByEmailAsync(user.Email);

            if (existingUser == null)
            {
                var newUser = new User()
                {
                    Email = user.Email,
                    PasswordHash = user.Password
                };
                return Ok(newUser);
            }
            Console.WriteLine(existingUser.Email);
            return Ok("User already exists");

        }
    }
}
