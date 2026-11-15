namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Serializes FreeAstroAPI requests across transient service instances to honor free-tier pacing.</summary>
public sealed class FreeAstroApiRequestPacer
{
    private static readonly TimeSpan MinimumInterval = TimeSpan.FromSeconds(1);
    private readonly SemaphoreSlim _gate = new(1, 1);
    private DateTimeOffset _nextRequestAt;

    /// <summary>Waits a full interval after the previous response so variable network latency cannot bunch provider arrivals.</summary>
    public async Task<IAsyncDisposable> EnterAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var wait = _nextRequestAt - DateTimeOffset.UtcNow;
            if (wait > TimeSpan.Zero)
                await Task.Delay(wait, cancellationToken);

            return new Lease(this);
        }
        catch
        {
            _gate.Release();
            throw;
        }
    }

    private sealed class Lease(FreeAstroApiRequestPacer owner) : IAsyncDisposable
    {
        private FreeAstroApiRequestPacer? _owner = owner;

        public ValueTask DisposeAsync()
        {
            var owner = Interlocked.Exchange(ref _owner, null);
            if (owner is not null)
            {
                owner._nextRequestAt = DateTimeOffset.UtcNow + MinimumInterval;
                owner._gate.Release();
            }
            return ValueTask.CompletedTask;
        }
    }
}
