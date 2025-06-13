namespace AuraLogbook.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString();
}
