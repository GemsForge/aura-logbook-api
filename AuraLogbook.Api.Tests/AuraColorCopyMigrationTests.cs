namespace AuraLogbook.Api.Tests;

/// <summary>Restores legacy placeholder descriptions without overwriting authored reference content.</summary>
public sealed class AuraColorCopyMigrationTests
{
    [Fact]
    public void Placeholder_copy_is_repaired_while_custom_descriptions_survive_reapplication()
    {
        using var connection = MigrationTestDatabase.OpenAll();
        var expectedYellow = MigrationTestDatabase.Scalar(connection, "SELECT Description FROM AuraColorDefinitions WHERE AuraColorKey='yellow'");
        MigrationTestDatabase.Execute(connection, "UPDATE AuraColorDefinitions SET Description='Yellow reflective energy.' WHERE AuraColorKey='yellow'; UPDATE AuraColorDefinitions SET Description='My custom blue meaning' WHERE AuraColorKey='blue'; UPDATE AuraColorDefinitions SET Description='' WHERE AuraColorKey='red';");
        var migration = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "AuraLogbook.Api", "Data", "Database", "Migrations", "033_restore_aura_color_reference_copy.sql"));
        MigrationTestDatabase.Execute(connection, migration);
        MigrationTestDatabase.Execute(connection, migration);
        Assert.Equal(expectedYellow, MigrationTestDatabase.Scalar(connection, "SELECT Description FROM AuraColorDefinitions WHERE AuraColorKey='yellow'"));
        Assert.Equal("My custom blue meaning", MigrationTestDatabase.Scalar(connection, "SELECT Description FROM AuraColorDefinitions WHERE AuraColorKey='blue'"));
        Assert.Equal("Rooted, grounded energy for safety and survival.", MigrationTestDatabase.Scalar(connection, "SELECT Description FROM AuraColorDefinitions WHERE AuraColorKey='red'"));
    }
}
