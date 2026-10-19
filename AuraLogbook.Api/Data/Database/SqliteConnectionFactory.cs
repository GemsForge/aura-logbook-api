using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Data.Database;

public sealed class SqliteConnectionFactory : IDbConnectionFactory
{
    private readonly DatabaseOptions _options;

    public SqliteConnectionFactory(IOptions<DatabaseOptions> options)
    {
        _options = options.Value;
    }

    public SqliteConnection CreateConnection()
    {
        var connection = new SqliteConnection(_options.ConnectionString);
        connection.Open();

        using var command = connection.CreateCommand();
        command.CommandText = "PRAGMA foreign_keys = ON;";
        command.ExecuteNonQuery();

        return connection;
    }
}
    /// <summary>Initializes a connection factory from the application database options.</summary>
    /// <summary>Creates an open SQLite connection with foreign-key enforcement enabled.</summary>
