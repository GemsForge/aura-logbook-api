namespace AuraLogbook.Api.Models.Dto
{
    public class AuthRequest
    {
        public string Email { get; set; } = default!;
        public string Password { get; set; } = default!;
    }
}