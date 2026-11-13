using AuraLogbook.Api.Data.Database;
using AuraLogbook.Api.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace AuraLogbook.Api.Tests;

/// <summary>#353: every environment, including Production, persists journal data relationally.</summary>
public sealed class JournalPersistenceTests
{
    [Fact]
    public void Registers_sqlite_repositories_for_users_moods_and_zodiac_insights()
    {
        var services = new ServiceCollection().AddRelationalJournalRepositories();

        Assert.Equal(typeof(SqliteUserRepository), Implementation<IFileUserRepository>(services));
        Assert.Equal(typeof(SqliteMoodRepository), Implementation<IFileMoodRepository>(services));
        Assert.Equal(typeof(SqliteZodiacInsightsRepository), Implementation<IFileZodiacInsightsRepository>(services));
    }

    /// <summary>Program.cs registers journal repositories only through the shared relational method.</summary>
    [Fact]
    public void Program_has_no_json_file_repository_registration()
    {
        var program = File.ReadAllText(Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Program.cs")));

        Assert.Contains("AddRelationalJournalRepositories()", program);
        Assert.DoesNotContain("FileUserRepository>", program);
        Assert.DoesNotContain("FileMoodRepository>", program);
        Assert.DoesNotContain("FileZodiacInsightsRepository>", program);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Data Source=:memory:")]
    [InlineData("Data Source=prod;Mode=Memory;Cache=Shared")]
    [InlineData("Data Source=Data/auralogbook-dev.db")]
    [InlineData("Data Source=/var/data/AuraLogbook-Dev.db")]
    public void Production_rejects_missing_in_memory_or_development_databases(string? connection)
    {
        Assert.NotNull(JournalPersistence.ValidateProductionConnection(connection));
    }

    [Theory]
    [InlineData("Data Source=/var/lib/auralogbook/auralogbook.db")]
    [InlineData("Data Source=/home/data/aura-prod.db;Cache=Shared")]
    public void Production_accepts_an_explicit_durable_database(string connection)
    {
        Assert.Null(JournalPersistence.ValidateProductionConnection(connection));
    }

    private static Type? Implementation<TService>(IServiceCollection services) =>
        services.Last(d => d.ServiceType == typeof(TService)).ImplementationType;
}
