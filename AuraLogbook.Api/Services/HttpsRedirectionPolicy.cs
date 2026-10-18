namespace AuraLogbook.Api.Services;

public static class HttpsRedirectionPolicy
{
    public static bool ShouldApply(bool isDevelopment, IEnumerable<string> urls)
    {
        if (!isDevelopment)
        {
            return true;
        }

        return urls.Any(url =>
            Uri.TryCreate(url, UriKind.Absolute, out var address)
            && address.Scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase));
    }
}
