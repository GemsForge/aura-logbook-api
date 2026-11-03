using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using AuraLogbook.Api.Configuration;
using AuraLogbook.Api.Services.Spotify;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Controllers;

/// <summary>Authenticated Spotify metadata and OAuth entry point; callback uses one-use persisted state.</summary>
[ApiController]
[Authorize]
[Route("api/spotify")]
public sealed class SpotifyController(ISpotifyService service, IOptions<SpotifyOptions> options, ILogger<SpotifyController> logger) : ControllerBase
{
    /// <summary>Creates a fresh authorization attempt; credentials and tokens stay on the server.</summary>
    [HttpPost("connect")]
    public Task<IActionResult> Connect() => ExecuteAsync(async () => new { authorizationUrl = await service.CreateAuthorizationUrlAsync(UserId()) });

    /// <summary>Exchanges OAuth codes and returns only a safe result code to the UI.</summary>
    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error, CancellationToken cancellationToken)
    {
        var result = "denied";
        if (string.IsNullOrWhiteSpace(error) && !string.IsNullOrWhiteSpace(code) && !string.IsNullOrWhiteSpace(state))
        {
            try
            {
                await service.CompleteAuthorizationAsync(state, code, cancellationToken);
                result = "connected";
            }
            catch (SpotifyIntegrationException exception)
            {
                result = exception.Code;
                logger.LogWarning("Spotify callback failed: {FailureCode}", result);
            }
            catch (Exception exception) when (exception is HttpRequestException or JsonException or CryptographicException or KeyNotFoundException or TaskCanceledException)
            {
                result = "unavailable";
                logger.LogWarning("Spotify callback failed: {FailureType}", exception.GetType().Name);
            }
        }
        Response.Headers.CacheControl = "no-store";
        Response.Headers["Referrer-Policy"] = "no-referrer";
        return Redirect(QueryHelpers.AddQueryString(options.Value.FrontendRedirectUri, "spotify", result));
    }

    [HttpGet("connection")]
    public Task<IActionResult> Connection() => ExecuteAsync(async () => await service.GetConnectionAsync(UserId()));

    [HttpDelete("connection")]
    public async Task<IActionResult> Disconnect()
    {
        await service.DisconnectAsync(UserId());
        return NoContent();
    }

    [HttpGet("currently-playing")]
    public Task<IActionResult> CurrentlyPlaying(CancellationToken cancellationToken) =>
        ExecuteAsync(async () => await service.GetCurrentlyPlayingAsync(UserId(), cancellationToken));

    [HttpGet("playlists")]
    public Task<IActionResult> Playlists(CancellationToken cancellationToken) =>
        ExecuteAsync(async () => await service.GetPlaylistsAsync(UserId(), cancellationToken));

    // Convert provider failures into safe, stable JSON so the UI can offer useful recovery.
    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        Response.Headers.CacheControl = "no-store";
        try { return new JsonResult(await action()); }
        catch (SpotifyIntegrationException exception)
        {
            return StatusCode(exception.StatusCode, new { code = exception.Code, message = exception.Message });
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException or CryptographicException or KeyNotFoundException or TaskCanceledException)
        {
            logger.LogWarning("Spotify metadata request failed: {FailureType}", exception.GetType().Name);
            return StatusCode(502, new { code = "unavailable", message = "Spotify is temporarily unavailable. Please retry." });
        }
    }

    private int UserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}
