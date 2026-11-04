namespace AuraLogbook.Api.Services;

/// <summary>Stores uploaded bytes outside the web root and addresses them with opaque keys.</summary>
public interface IMoodMediaFileStore
{
    /// <summary>Writes a validated image stream and returns its generated storage key.</summary>
    Task<string> SaveAsync(Stream source, string contentType, CancellationToken cancellationToken);

    /// <summary>Opens a private file by its server-generated storage key, or returns null if missing.</summary>
    Task<Stream?> OpenReadAsync(string storageKey, CancellationToken cancellationToken);

    /// <summary>Deletes a private file; deleting an already missing file is successful.</summary>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);
}
