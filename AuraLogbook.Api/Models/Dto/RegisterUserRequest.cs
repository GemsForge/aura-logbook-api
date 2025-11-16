using System.ComponentModel.DataAnnotations;

namespace AuraLogbook.Api.Models.Dto
{
    public class RegisterUserRequest : AuthRequest
    {
        [MaxLength(30, ErrorMessage = "Display name cannot exceed 30 characters.")]
        public string? DisplayName { get; set; }
        [Required(ErrorMessage = "Date is required.")]
        public DateOnly Birthday { get; set; } = DateOnly.MaxValue;
        // public byte[]? ProfilePictureBlob { get; set; }
        public string? AuraColor { get; set; }
        public int? AuraIntensity { get; set; }

        public List<SpiritualPathway> SpiritualPathways { get; set; } = new();
        public SpiritualPathway? SelectedPathway { get; internal set; }
    }
}
