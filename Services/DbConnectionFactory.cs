using System.Data;
using Microsoft.Data.Sqlite;

namespace AuraLogbook.Api.Services;

public class DbConnectionFactory(IConfiguration configuration)
{
    private readonly IConfiguration _configuration = configuration;

    public IDbConnection CreateConnection()
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        return new SqliteConnection(connectionString);
    }
}
