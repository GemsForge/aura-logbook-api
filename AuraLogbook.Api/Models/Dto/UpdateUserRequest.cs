namespace AuraLogbook.Api.Models.Dto
{
    public class UpdateUserRequest
    {
        public int Id { get; set; }
        public string Email { get; set; } = default!;
        public string? Password { get; set; }
        public string? DisplayName { get; set; }
    }

}