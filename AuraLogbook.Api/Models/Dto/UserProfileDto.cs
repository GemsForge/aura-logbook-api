namespace AuraLogbook.Api.Models.Dto
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public required string Email { get; set; }
        public required string DisplayName { get; set; }
        public string? ZodiacSign { get; set; }
        public DateTime? Birthday { get; set; }
        public string? Avatar { get; set; }
    }
}
s