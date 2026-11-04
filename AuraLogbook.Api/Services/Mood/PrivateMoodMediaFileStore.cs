using AuraLogbook.Api.Models;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Services;

/// <summary>Stores mood images under a private directory that cannot be served as static web content.</summary>
public sealed class PrivateMoodMediaFileStore : IMoodMediaFileStore
{
    private readonly string _directory;

    /// <summary>Resolves and creates the configured private directory, rejecting paths beneath wwwroot.</summary>
    public PrivateMoodMediaFileStore(IOptions<StorageSettings> options, IWebHostEnvironment environment)
    {
        var configuredPath = string.IsNullOrWhiteSpace(options.Value.PrivateMediaPath)
            ? "Data/private-media"
            : options.Value.PrivateMediaPath;
        _directory = Path.GetFullPath(Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(environment.ContentRootPath, configuredPath));

        var webRoot = Path.GetFullPath(environment.WebRootPath ?? Path.Combine(environment.ContentRootPath, "wwwroot"));
        var comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
        var webRootPrefix = Path.EndsInDirectorySeparator(webRoot) ? webRoot : webRoot + Path.DirectorySeparatorChar;
        if (_directory.Equals(webRoot, comparison) || _directory.StartsWith(webRootPrefix, comparison))
            throw new InvalidOperationException("Private mood media storage must be outside the web root.");

        Directory.CreateDirectory(_directory);
        if (!OperatingSystem.IsWindows())
            File.SetUnixFileMode(_directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
    }

    /// <inheritdoc />
    public async Task<string> SaveAsync(Stream source, string contentType, CancellationToken cancellationToken)
    {
        var extension = contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => throw new InvalidOperationException("Unsupported media type reached private storage.")
        };
        var storageKey = $"{Guid.NewGuid():N}{extension}";
        var path = ResolvePath(storageKey);

        try
        {
            await using (var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
                await source.CopyToAsync(output, cancellationToken);
            if (!OperatingSystem.IsWindows())
                File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
            return storageKey;
        }
        catch
        {
            if (File.Exists(path))
                File.Delete(path);
            throw;
        }
    }

    /// <inheritdoc />
    public Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = ResolvePath(storageKey);
        if (!File.Exists(path))
            return Task.FromResult<Stream?>(null);
        Stream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 81920, useAsync: true);
        return Task.FromResult<Stream?>(stream);
    }

    /// <inheritdoc />
    public Task DeleteAsync(string storageKey, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var path = ResolvePath(storageKey);
        if (File.Exists(path))
            File.Delete(path);
        return Task.CompletedTask;
    }

    private string ResolvePath(string storageKey)
    {
        if (string.IsNullOrWhiteSpace(storageKey) || !string.Equals(Path.GetFileName(storageKey), storageKey, StringComparison.Ordinal))
            throw new InvalidOperationException("Invalid private media storage key.");
        return Path.Combine(_directory, storageKey);
    }
}
