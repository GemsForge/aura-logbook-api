namespace AuraLogbook.Api.Data.Database;

public sealed class DatabaseOptions
{
    public string ConnectionString { get; set; } = "Data Source=Data/auralogbook-dev.db";
    public bool SeedUsersOnStartup { get; set; }
}
