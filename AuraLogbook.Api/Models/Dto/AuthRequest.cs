using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    /// <summary>
    /// Login credentials. Keeps the legacy 6-character minimum on purpose so existing accounts
    /// with 6- or 7-character passwords can still sign in; new passwords use <see cref="PasswordRules"/>.
    /// </summary>
    public class AuthRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = default!;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string Password { get; set; } = default!;
    }
}
