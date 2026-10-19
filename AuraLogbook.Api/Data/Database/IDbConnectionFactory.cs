using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Data.Database;

public interface IDbConnectionFactory
{
    SqliteConnection CreateConnection();
}
