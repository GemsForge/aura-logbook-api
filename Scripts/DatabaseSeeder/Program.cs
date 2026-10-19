using System.Globalization;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using AuraLogbook.Api.Models.Enums;

SQLitePCL.Batteries_V2.Init();
var options = ParseArguments(args);
var inputPath = Path.GetFullPath(options.GetValueOrDefault("input", "AuraLogbook.Api/Data/users.json"));
var databasePath = Path.GetFullPath(options.GetValueOrDefault("database", "AuraLogbook.Api/Data/auralogbook-dev.db"));

if (!File.Exists(inputPath)) throw new FileNotFoundException("User JSON source was not found.", inputPath);
Directory.CreateDirectory(Path.GetDirectoryName(databasePath)!);
await using var connection = new SqliteConnection($"Data Source={databasePath}");
await connection.OpenAsync();

await using (var pragma = connection.CreateCommand())
{
    pragma.CommandText = "PRAGMA foreign_keys = ON;";
    await pragma.ExecuteNonQueryAsync();
}

var migrationDirectory = Path.GetFullPath(options.GetValueOrDefault("migration", "AuraLogbook.Api/Data/Database/Migrations"));
if (File.Exists(migrationDirectory)) migrationDirectory = Path.GetDirectoryName(migrationDirectory)!;
if (!Directory.Exists(migrationDirectory)) throw new DirectoryNotFoundException($"Migration directory was not found: {migrationDirectory}");
await using (var history = connection.CreateCommand())
{
    history.CommandText = "CREATE TABLE IF NOT EXISTS __SchemaMigrations (MigrationName TEXT NOT NULL PRIMARY KEY, AppliedAt TEXT NOT NULL);";
    await history.ExecuteNonQueryAsync();
}
foreach (var migrationPath in Directory.EnumerateFiles(migrationDirectory, "*.sql").OrderBy(path => path))
{
    var migrationName = Path.GetFileName(migrationPath);
    await using (var applied = connection.CreateCommand())
    {
        applied.CommandText = "SELECT EXISTS (SELECT 1 FROM __SchemaMigrations WHERE MigrationName = $name);";
        applied.Parameters.AddWithValue("$name", migrationName);
        if (Convert.ToInt32(await applied.ExecuteScalarAsync()) == 1) continue;
    }
    await using var schema = connection.CreateCommand();
    schema.CommandText = await File.ReadAllTextAsync(migrationPath);
    await schema.ExecuteNonQueryAsync();
    await using var record = connection.CreateCommand();
    record.CommandText = "INSERT INTO __SchemaMigrations (MigrationName, AppliedAt) VALUES ($name, $appliedAt);";
    record.Parameters.AddWithValue("$name", migrationName);
    record.Parameters.AddWithValue("$appliedAt", DateTime.UtcNow.ToString("O"));
    await record.ExecuteNonQueryAsync();
}

var json = await File.ReadAllTextAsync(inputPath);
var users = JsonSerializer.Deserialize<List<LegacyUser>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
var failures = new List<string>();
var imported = 0;
var userIdMap = new Dictionary<int, int>();

await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync();
foreach (var user in users)
{
    if (user.Id <= 0 || string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.PasswordHash))
    {
        failures.Add($"User {user.Id}: Id, Email, and PasswordHash are required.");
        continue;
    }
    if (!TryParseTimestamp(user.CreatedAt, out var createdAt) || !TryParseTimestamp(user.UpdatedAt, out var updatedAt))
    {
        failures.Add($"User {user.Id} ({user.Email}): invalid CreatedAt or UpdatedAt.");
        continue;
    }

    await using var command = connection.CreateCommand();
    command.Transaction = transaction;
    command.CommandText = """
        INSERT INTO Users
            (Id, Email, PasswordHash, DisplayName, Birthday, ZodiacSign, AuraColor, AuraIntensity, Avatar, Motto, SelectedPathway, CreatedAt, UpdatedAt)
        VALUES
            ($id, $email, $passwordHash, $displayName, $birthday, $zodiacSign, $auraColor, $auraIntensity, $avatar, $motto, $selectedPathway, $createdAt, $updatedAt)
        ON CONFLICT(Email) DO UPDATE SET
            Email = excluded.Email, PasswordHash = excluded.PasswordHash, DisplayName = excluded.DisplayName,
            Birthday = excluded.Birthday, ZodiacSign = excluded.ZodiacSign, AuraColor = excluded.AuraColor,
            AuraIntensity = excluded.AuraIntensity, Avatar = excluded.Avatar, Motto = excluded.Motto,
            SelectedPathway = excluded.SelectedPathway, CreatedAt = excluded.CreatedAt, UpdatedAt = excluded.UpdatedAt;
        """;
    command.Parameters.AddWithValue("$id", user.Id);
    command.Parameters.AddWithValue("$email", user.Email.Trim());
    command.Parameters.AddWithValue("$passwordHash", user.PasswordHash);
    command.Parameters.AddWithValue("$displayName", (object?)user.DisplayName ?? DBNull.Value);
    command.Parameters.AddWithValue("$birthday", NormalizeBirthday(user.Birthday) ?? (object)DBNull.Value);
    command.Parameters.AddWithValue("$zodiacSign", (object?)user.ZodiacSign ?? DBNull.Value);
    command.Parameters.AddWithValue("$auraColor", string.IsNullOrWhiteSpace(user.AuraColor) ? "blue" : user.AuraColor.ToLowerInvariant());
    command.Parameters.AddWithValue("$auraIntensity", NormalizeIntensity(user.AuraIntensity));
    command.Parameters.AddWithValue("$avatar", (object?)user.Avatar ?? DBNull.Value);
    command.Parameters.AddWithValue("$motto", (object?)user.Motto ?? DBNull.Value);
    command.Parameters.AddWithValue("$selectedPathway", user.SelectedPathway);
    command.Parameters.AddWithValue("$createdAt", createdAt.ToString("O"));
    command.Parameters.AddWithValue("$updatedAt", updatedAt.ToString("O"));
    await command.ExecuteNonQueryAsync();
    await using var canonical = connection.CreateCommand();
    canonical.CommandText = "SELECT Id FROM Users WHERE Email = $email;";
    canonical.Parameters.AddWithValue("$email", user.Email.Trim());
    userIdMap[user.Id] = Convert.ToInt32(await canonical.ExecuteScalarAsync());
    imported++;
}

if (failures.Count > 0)
{
    await transaction.RollbackAsync();
    Console.Error.WriteLine($"Import aborted. {failures.Count} record(s) failed validation:");
    foreach (var failure in failures) Console.Error.WriteLine($"- {failure}");
    return 1;
}

await transaction.CommitAsync();
var moodsPath = Path.GetFullPath(options.GetValueOrDefault("moods", "AuraLogbook.Api/Data/moods.json"));
var zodiacPath = Path.GetFullPath(options.GetValueOrDefault("zodiac", "AuraLogbook.Api/Data/zodiacInsights.json"));
var moodCount = await SeedMoodsAsync(connection, moodsPath, userIdMap);
await SeedReferenceDataAsync(connection);
var zodiacCount = await SeedZodiacAsync(connection, zodiacPath);
var reportPath = Path.GetFullPath(options.GetValueOrDefault("report", "AuraLogbook.Api/Data/seed-reconciliation.json"));
var report = new
{
    generatedAt = DateTime.UtcNow,
    source = new { users = users.Count, moods = JsonSerializer.Deserialize<JsonElement>(await File.ReadAllTextAsync(moodsPath)).GetArrayLength(), zodiacSigns = zodiacCount },
    imported = new { users = imported, moodEntries = moodCount, zodiacSigns = zodiacCount },
    uniqueUsers = await CountAsync(connection, "Users"),
    storedMoodEntries = await CountAsync(connection, "MoodEntries"),
    storedMoodPairs = await CountAsync(connection, "MoodEntryMoods"),
    storedZodiacSigns = await CountAsync(connection, "ZodiacSigns"),
    storedInsightTemplates = await CountAsync(connection, "InsightTemplates")
};
await File.WriteAllTextAsync(reportPath, JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
Console.WriteLine($"Seeded {imported} users, {moodCount} mood entries, and {zodiacCount} zodiac signs into {databasePath}.");
Console.WriteLine($"Reconciliation report: {reportPath}");
return 0;

static async Task<int> CountAsync(SqliteConnection connection, string table)
{
    await using var command = connection.CreateCommand();
    command.CommandText = $"SELECT COUNT(*) FROM {table};";
    return Convert.ToInt32(await command.ExecuteScalarAsync());
}

static async Task<int> SeedMoodsAsync(SqliteConnection connection, string path, IReadOnlyDictionary<int, int> userIdMap)
{
    var entries = JsonSerializer.Deserialize<List<LegacyMood>>(await File.ReadAllTextAsync(path), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
    await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync();
    foreach (var mood in Enum.GetValues<MoodType>())
    {
        await using var definition = connection.CreateCommand();
        definition.Transaction = transaction;
        definition.CommandText = "INSERT INTO MoodDefinitions (MoodKey, DisplayName) VALUES ($key, $name) ON CONFLICT(MoodKey) DO NOTHING;";
        definition.Parameters.AddWithValue("$key", mood.ToString());
        definition.Parameters.AddWithValue("$name", mood.ToString());
        await definition.ExecuteNonQueryAsync();
    }
    foreach (var entry in entries)
    {
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            INSERT INTO MoodEntries (Id, UserId, EntryDate, Comment, CreatedAt, UpdatedAt)
            VALUES ($id, $userId, $date, $comment, $createdAt, $updatedAt)
            ON CONFLICT(Id) DO UPDATE SET UserId=excluded.UserId, EntryDate=excluded.EntryDate, Comment=excluded.Comment, CreatedAt=excluded.CreatedAt, UpdatedAt=excluded.UpdatedAt;
            """;
        command.Parameters.AddWithValue("$id", entry.Id);
        command.Parameters.AddWithValue("$userId", userIdMap.GetValueOrDefault(entry.UserId, entry.UserId));
        command.Parameters.AddWithValue("$date", entry.Date);
        command.Parameters.AddWithValue("$comment", (object?)entry.Comment ?? DBNull.Value);
        command.Parameters.AddWithValue("$createdAt", entry.CreatedAt ?? DateTime.UtcNow.ToString("O"));
        command.Parameters.AddWithValue("$updatedAt", entry.CreatedAt ?? DateTime.UtcNow.ToString("O"));
        await command.ExecuteNonQueryAsync();
        foreach (var moodValue in entry.Moods.Distinct())
        {
            if (!Enum.IsDefined(typeof(MoodType), moodValue)) throw new InvalidOperationException($"Unknown mood value {moodValue}.");
            await using var pair = connection.CreateCommand();
            pair.Transaction = transaction;
            pair.CommandText = "INSERT INTO MoodEntryMoods (MoodEntryId, MoodKey) VALUES ($entryId, $moodKey) ON CONFLICT DO NOTHING;";
            pair.Parameters.AddWithValue("$entryId", entry.Id);
            pair.Parameters.AddWithValue("$moodKey", ((MoodType)moodValue).ToString());
            await pair.ExecuteNonQueryAsync();
        }
    }
    await transaction.CommitAsync();
    return entries.Count;
}

static async Task SeedReferenceDataAsync(SqliteConnection connection)
{
    var chakras = new[]
    {
        ("root", "Root", "Grounding, safety, and stability."),
        ("sacral", "Sacral", "Creativity, vitality, and emotional flow."),
        ("solar_plexus", "Solar Plexus", "Confidence, agency, and motivation."),
        ("heart", "Heart", "Compassion, balance, and connection."),
        ("throat", "Throat", "Communication, expression, and clarity."),
        ("third_eye", "Third Eye", "Intuition, insight, and perception."),
        ("crown", "Crown", "Meaning, spirituality, and higher reflection.")
    };
    foreach (var (key, name, description) in chakras)
        await ExecuteReferenceAsync(connection, "INSERT INTO ChakraDefinitions (ChakraKey, DisplayName, Description) VALUES ($key,$name,$description) ON CONFLICT(ChakraKey) DO UPDATE SET DisplayName=excluded.DisplayName, Description=excluded.Description;", new() { ["$key"] = key, ["$name"] = name, ["$description"] = description });

    var colors = new[]
    {
        ("red", "Red", "#f44336", "root", 0), ("orange", "Orange", "#ff9800", "sacral", 0),
        ("yellow", "Yellow", "#ffeb3b", "solar_plexus", 0), ("green", "Green", "#4caf50", "heart", 0),
        ("blue", "Blue", "#2196f3", "throat", 0), ("indigo", "Indigo", "#3f51b5", "third_eye", 0),
        ("violet", "Violet", "#9c27b0", "crown", 0), ("gray", "Gray", "#9e9e9e", "root", 1),
        ("pink", "Pink", "#e91e63", "heart", 0)
    };
    foreach (var (key, name, hex, chakra, neutral) in colors)
        await ExecuteReferenceAsync(connection, "INSERT INTO AuraColorDefinitions (AuraColorKey, DisplayName, Description, ChakraKey, BaseHex, IsNeutral) VALUES ($key,$name,$description,$chakra,$hex,$neutral) ON CONFLICT(AuraColorKey) DO UPDATE SET DisplayName=excluded.DisplayName, Description=excluded.Description, ChakraKey=excluded.ChakraKey, BaseHex=excluded.BaseHex, IsNeutral=excluded.IsNeutral;", new() { ["$key"] = key, ["$name"] = name, ["$description"] = $"{name} reflective energy.", ["$chakra"] = chakra, ["$hex"] = hex, ["$neutral"] = neutral });

    var pathways = new[] { (0, "Mindful Living", "Calm, clarity, and self-awareness."), (1, "Astrology & Energy", "Zodiac, chakras, and energy reflection."), (2, "Faith & Religion", "Faith-guided reflection and gratitude.") };
    foreach (var (key, name, description) in pathways)
        await ExecuteReferenceAsync(connection, "INSERT INTO SpiritualPathways (PathwayKey, DisplayName, Description) VALUES ($key,$name,$description) ON CONFLICT(PathwayKey) DO UPDATE SET DisplayName=excluded.DisplayName, Description=excluded.Description;", new() { ["$key"] = key, ["$name"] = name, ["$description"] = description });

    var mappings = new[] { ("Empowered", "yellow"), ("Centered", "yellow"), ("Harmonious", "blue"), ("Flowing", "orange"), ("Weary", "gray"), ("Tense", "red"), ("Frustrated", "red"), ("Restless", "indigo"), ("Disconnected", "indigo"), ("Heavy", "blue"), ("Charged", "red"), ("Scattered", "violet"), ("Abundant", "green"), ("Visionary", "pink"), ("Neutral", "gray") };
    foreach (var (mood, color) in mappings)
        await ExecuteReferenceAsync(connection, "INSERT INTO MoodAuraMappings (MoodKey, AuraColorKey) VALUES ($mood,$color) ON CONFLICT DO NOTHING;", new() { ["$mood"] = mood, ["$color"] = color });
}

static async Task ExecuteReferenceAsync(SqliteConnection connection, string sql, Dictionary<string, object> parameters)
{
    await using var command = connection.CreateCommand(); command.CommandText = sql;
    foreach (var parameter in parameters) command.Parameters.AddWithValue(parameter.Key, parameter.Value);
    await command.ExecuteNonQueryAsync();
}

static async Task<int> SeedZodiacAsync(SqliteConnection connection, string path)
{
    var signs = JsonSerializer.Deserialize<List<LegacyZodiac>>(await File.ReadAllTextAsync(path), new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
    await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync();
    foreach (var sign in signs)
    {
        await using var zodiac = connection.CreateCommand();
        zodiac.Transaction = transaction;
        zodiac.CommandText = "INSERT INTO ZodiacSigns (SignKey, Description, Element) VALUES ($key, $description, $element) ON CONFLICT(SignKey) DO UPDATE SET Description=excluded.Description, Element=excluded.Element;";
        zodiac.Parameters.AddWithValue("$key", sign.Sign.ToLowerInvariant());
        zodiac.Parameters.AddWithValue("$description", sign.Description);
        zodiac.Parameters.AddWithValue("$element", sign.Element);
        await zodiac.ExecuteNonQueryAsync();
        await using var clear = connection.CreateCommand();
        clear.Transaction = transaction;
        clear.CommandText = "DELETE FROM InsightTemplates WHERE ZodiacSignKey = $key;";
        clear.Parameters.AddWithValue("$key", sign.Sign.ToLowerInvariant());
        await clear.ExecuteNonQueryAsync();
        foreach (var insight in sign.Insights)
        {
            await using var template = connection.CreateCommand();
            template.Transaction = transaction;
            template.CommandText = "INSERT INTO InsightTemplates (ZodiacSignKey, InsightType, Title, Message) VALUES ($key, $type, $title, $message);";
            template.Parameters.AddWithValue("$key", sign.Sign.ToLowerInvariant());
            template.Parameters.AddWithValue("$type", insight.Type);
            template.Parameters.AddWithValue("$title", insight.Title);
            template.Parameters.AddWithValue("$message", insight.Message);
            await template.ExecuteNonQueryAsync();
        }
    }
    await transaction.CommitAsync();
    return signs.Count;
}

static Dictionary<string, string> ParseArguments(string[] args)
{
    var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    for (var i = 0; i < args.Length - 1; i++)
        if (args[i].StartsWith("--")) result[args[i][2..]] = args[++i];
    return result;
}

static bool TryParseTimestamp(string? value, out DateTime timestamp) =>
    DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out timestamp);

static string? NormalizeBirthday(string? value) =>
    DateOnly.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date) && date != DateOnly.MinValue
        ? date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) : null;

static int NormalizeIntensity(int value) => value > 100 ? Math.Clamp((int)Math.Round(value / 10d), 0, 100) : Math.Clamp(value, 0, 100);

file sealed class LegacyUser
{
    public int Id { get; set; }
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
    public string? DisplayName { get; set; }
    public string? Birthday { get; set; }
    public string? ZodiacSign { get; set; }
    public string? AuraColor { get; set; }
    public int AuraIntensity { get; set; }
    public string? Avatar { get; set; }
    public string? Motto { get; set; }
    public int SelectedPathway { get; set; }
}

file sealed class LegacyMood
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Date { get; set; } = string.Empty;
    public List<int> Moods { get; set; } = [];
    public string? Comment { get; set; }
    public string? CreatedAt { get; set; }
}

file sealed class LegacyZodiac
{
    public string Sign { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Element { get; set; } = string.Empty;
    public List<LegacyInsight> Insights { get; set; } = [];
}

file sealed class LegacyInsight
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
