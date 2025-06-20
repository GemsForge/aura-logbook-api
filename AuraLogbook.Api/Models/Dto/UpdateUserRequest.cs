using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    public class UpdateUserRequest : AuthRequest
    {
        [Required]
        public int Id { get; set; }

        [MaxLength(30, ErrorMessage = "Display name cannot exceed 30 characters.")]
        public string? DisplayName { get; set; }
        public DateOnly Birthday { get; set; }
        public byte[]? ProfilePictureBlob { get; set; }
    }

}