namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Warms missing historical moon dates without extending the user's cycle request.</summary>
public sealed class MoonCyclePrefetchWorker(
    MoonCyclePrefetchQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<MoonCyclePrefetchWorker> logger) : BackgroundService
{
    /// <summary>Fetches queued dates sequentially, respecting the shared provider rate limiter.</summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var date in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var service = scope.ServiceProvider.GetRequiredService<IMoonPhaseMoodInsightsService>();
                await service.PrefetchMoonAsync(date, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogWarning(exception, "Could not prefetch moon details for {Date}.", date);
            }
            finally
            {
                queue.Complete(date);
            }
        }
    }
}
