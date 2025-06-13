using Dapper;
using AuraLogbook.Api.Services;

namespace AuraLogbook.Api.Repositories;

public class HealthCheckRepository(DbConnectionFactory dbFactory)
{
    private readonly DbConnectionFactory _dbFactory = dbFactory;

    public async Task<bool> CanConnectAsync()
    {
        using var conn = _dbFactory.CreateConnection();
        var result = await conn.ExecuteScalarAsync<int>("SELECT 1");
        return result == 1;
    }
}
