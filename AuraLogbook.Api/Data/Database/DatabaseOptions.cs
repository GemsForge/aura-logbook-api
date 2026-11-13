namespace AuraLogbook.Api.Data.Database;

public sealed class DatabaseOptions
{
    /// <summary>Gets or sets the connection string for the active relational database.</summary>
    public string ConnectionString { get; set; } = "Data Source=Data/auralogbook-dev.db";

    /// <summary>Gets or sets whether the development user JSON is imported at API startup.</summary>
    public bool SeedUsersOnStartup { get; set; }

    /// <summary>
    /// Gets or sets whether curated mood-combination reflections are imported after startup migrations.
    /// On by default in every environment; the import is idempotent and touches no user data.
    /// </summary>
    public bool ImportReflectionsOnStartup { get; set; } = true;

    /// <summary>
    /// Gets or sets the curated reflection source. Relative paths resolve against the API's output folder,
    /// where the build copies <c>aura-ui/data/aura_logbook_mood_combinations.json</c>.
    /// </summary>
    public string ReflectionsSourcePath { get; set; } = "Data/aura_logbook_mood_combinations.json";
}
