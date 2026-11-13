namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Serializes FreeAstroAPI requests across transient service instances to honor free-tier pacing.</summary>
public sealed class FreeAstroApiRequestPacer
{
    private static readonly TimeSpan MinimumInterval = TimeSpan.FromSeconds(1);
    private readonly SemaphoreSlim _gate = new(1, 1);
    private DateTimeOffset _nextRequestAt;

    /// <summary>Waits for the shared request slot and releases it after the caller completes its provider call.</summary>
    public async Task<IAsyncDisposable> EnterAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var wait = _nextRequestAt - DateTimeOffset.UtcNow;
            if (wait > TimeSpan.Zero)
                await Task.Delay(wait, cancellationToken);

            _nextRequestAt = DateTimeOffset.UtcNow + MinimumInterval;
            return new Lease(_gate);
        }
        catch
        {
            _gate.Release();
            throw;
        }
    }

    private sealed class Lease(SemaphoreSlim gate) : IAsyncDisposable
    {
        private SemaphoreSlim? _gate = gate;

        public ValueTask DisposeAsync()
        {
            Interlocked.Exchange(ref _gate, null)?.Release();
            return ValueTask.CompletedTask;
        }
    }
}
