using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    public class UpdatePasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = default!;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string NewPassword { get; set; } = default!;
    }
}
