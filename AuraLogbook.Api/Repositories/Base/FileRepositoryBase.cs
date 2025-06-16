using System.Text.Json;

namespace AuraLogbook.Api.Repositories.Base
{
    /// <summary>
    /// Provides base functionality for file-based repositories.
    /// Handles JSON serialization and deserialization.
    /// </summary>
    public abstract class FileRepositoryBase<T>
    {
        private readonly string _filePath;
        private readonly JsonSerializerOptions _jsonOptions = new() { WriteIndented = true };

        protected FileRepositoryBase(string filePath)
        {
            _filePath = filePath;
        }
        
        /// <summary>
        /// Shared method to read and deserialize
        /// </summary>
        protected async Task<List<T>> ReadFromFileAsync()
        {
            if (!File.Exists(_filePath))
                return new List<T>();

            var json = await File.ReadAllTextAsync(_filePath);

            if (string.IsNullOrWhiteSpace(json))
                return new List<T>();

            return JsonSerializer.Deserialize<List<T>>(json, _jsonOptions) ?? new();
        }

        /// <summary>
        /// Shared method to serialize and save list
        /// </summary>
        /// <param name="items"></param>
        protected async Task WriteToFileAsync(List<T> items)
        {
            var json = JsonSerializer.Serialize(items, _jsonOptions);
            await File.WriteAllTextAsync(_filePath, json);
        }

        /// <summary>
        /// Reads and deserializes all items from the JSON file.
        /// </summary>
        protected async Task<List<T>> LoadAllAsync()
        {
            if (!File.Exists(_filePath))
                return new List<T>();

            var json = await File.ReadAllTextAsync(_filePath);
            return JsonSerializer.Deserialize<List<T>>(json) ?? new();
        }

        /// <summary>
        /// Serializes and writes all items to the JSON file.
        /// </summary>
        protected async Task SaveAllAsync(List<T> items)
        {
            var json = JsonSerializer.Serialize(items, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(_filePath, json);
        }

        /// <summary>
        /// Clears all contents from the JSON file.
        /// </summary>
        protected async Task ClearFileAsync()
        {
            await File.WriteAllTextAsync(_filePath, "[]");
        }

        /// <summary>
        /// Checks if the file exists.
        /// </summary>
        protected bool FileExists() => File.Exists(_filePath);
    }
}
