using AuraLogbook.Api.Models;
using AuraLogbook.Api.Models.Dto;

namespace AuraLogbook.Api.Services
{
    public interface IUserService
    {
        Task<bool> AuthenticateAsync(string email, string password, Func<string, string, bool> verifyPasswordHash);
        Task ClearAllUsersAsync();
        Task<(bool Success, string Message)> DeleteUserAsync(int id);
        Task<bool> EmailExistsAsync(string email);
        Task<List<User>> GetAllUsersAsync();
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(int id);
        Task<int> GetUserCountAsync();
        Task<(bool Success, string Message)> RegisterAsync(RegisterUserRequest requestuser);
        Task<List<User>> SearchUsersAsync(string query);
        Task<(bool Success, string Message)> UpdateUserAsync(UpdateUserRequest request);
    }
}