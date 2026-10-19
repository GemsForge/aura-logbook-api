namespace AuraLogbook.Api.Data.Database;

public sealed class DatabaseOptions
{
    /// <summary>Gets or sets the connection string for the active relational database.</summary>
    public string ConnectionString { get; set; } = "Data Source=Data/auralogbook-dev.db";

    /// <summary>Gets or sets whether the development user JSON is imported at API startup.</summary>
    public bool SeedUsersOnStartup { get; set; }
}
