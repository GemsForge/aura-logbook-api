using AuraLogbook.Api.Models;

namespace AuraLogbook.Api.Repositories
{
    /// <summary>
    /// Defines file-based operations for managing user data.
    /// </summary>
    public interface IFileUserRepository
    {
        /// <summary>
        /// Retrieves all users from the data store.
        /// </summary>
        Task<List<User>> GetAllAsync();

        /// <summary>
        /// Retrieves a user by their email address.
        /// </summary>
        /// <param name="email">The user's email address.</param>
        Task<User?> GetByEmailAsync(string email);

        /// <summary>
        /// Creates a new user and returns the assigned Id.
        /// </summary>
        /// <param name="user">The user object to add.</param>
        Task<int> CreateAsync(User user);

        /// <summary>
        /// Retrieves a user by their Id.
        /// </summary>
        /// <param name="id">The user's unique identifier.</param>
        Task<User?> GetByIdAsync(int id);

        /// <summary>
        /// Updates an existing user.
        /// </summary>
        /// <param name="user">The user object with updated fields.</param>
        /// <returns>True if the update was successful, false otherwise.</returns>
        Task<bool> UpdateAsync(User user);

        /// <summary>
        /// Deletes a user by their Id.
        /// </summary>
        /// <param name="id">The Id of the user to delete.</param>
        /// <returns>True if the user was deleted, false otherwise.</returns>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Searches users by a partial match of name or email.
        /// </summary>
        /// <param name="query">The query string to match.</param>
        Task<List<User>> SearchAsync(string query);

        /// <summary>
        /// Deletes all users from the data store.
        /// </summary>
        Task ClearAsync();
    }
}
