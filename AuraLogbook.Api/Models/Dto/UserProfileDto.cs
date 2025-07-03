namespace AuraLogbook.Api.Models.Dto
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string DisplayName { get; set; }
        public string? ZodiacSign { get; set; }
        public required DateOnly Birthday { get; set; }
        public required string AuraColor { get; set; }
        public required int AuraIntensity { get; set; }
        public required string Avatar { get; set; }
        public required string Motto { get; set; }
        public required List<SpiritualPathway> SpiritualPathways { get; set; }
    }
}
