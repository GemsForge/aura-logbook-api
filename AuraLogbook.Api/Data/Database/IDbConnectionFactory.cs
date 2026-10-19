using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Data.Database;

public interface IDbConnectionFactory
{
    /// <summary>Creates and opens a database connection with the configured settings.</summary>
    SqliteConnection CreateConnection();
}
