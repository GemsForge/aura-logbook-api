namespace AuraLogbook.Api.Models
{
    public class StorageSettings
    {
        public string UserFilePath { get; set; } = string.Empty;
        public string MoodFilePath { get; set; } = string.Empty;
        public string ZodiacFilePath { get; set; } = string.Empty;
        /// <summary>Gets or sets the private image directory, which must stay outside the web root.</summary>
        public string PrivateMediaPath { get; set; } = "Data/private-media";

    }
}
