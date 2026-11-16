using System.Threading.Channels;

namespace AuraLogbook.Api.Services.Astrology;

/// <summary>Queues distinct moon dates so cold cycle requests can return before the provider cache is warm.</summary>
public sealed class MoonCyclePrefetchQueue
{
    private readonly Channel<DateOnly> _dates = Channel.CreateBounded<DateOnly>(new BoundedChannelOptions(256)
    {
        FullMode = BoundedChannelFullMode.Wait,
        SingleReader = true,
        SingleWriter = false,
    });
    private readonly HashSet<DateOnly> _pending = [];
    private readonly object _sync = new();

    /// <summary>Adds a date once while it is queued or being fetched.</summary>
    public void Enqueue(DateOnly date)
    {
        lock (_sync)
        {
            if (!_pending.Add(date)) return;
            if (!_dates.Writer.TryWrite(date)) _pending.Remove(date);
        }
    }

    /// <summary>Reports whether a date remains queued or is currently being fetched.</summary>
    public bool IsPending(DateOnly date)
    {
        lock (_sync) return _pending.Contains(date);
    }

    /// <summary>Reads the next date queued for provider cache warming.</summary>
    public IAsyncEnumerable<DateOnly> ReadAllAsync(CancellationToken cancellationToken) =>
        _dates.Reader.ReadAllAsync(cancellationToken);

    /// <summary>Allows a failed or completed date to be queued again by a later request.</summary>
    public void Complete(DateOnly date)
    {
        lock (_sync) _pending.Remove(date);
    }
}
