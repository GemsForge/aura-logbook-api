using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AuraLogbook.Api.Configuration;
using AuraLogbook.Api.Services.Spotify;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AuraLogbook.Api.Controllers;

/// <summary>Exposes Aura's server-mediated Spotify connection and metadata endpoints.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class SpotifyController : ControllerBase
{
    private readonly ISpotifyService _service;
    private readonly SpotifyOptions _options;
    public SpotifyController(ISpotifyService service, IOptions<SpotifyOptions> options) { _service = service; _options = options.Value; }

    [Authorize]
    [HttpGet("connect")]
    public IActionResult Connect() => Ok(new { authorizationUrl = _service.CreateAuthorizationUrl(UserId()) });

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback([FromQuery] string? code, [FromQuery] string? state, [FromQuery] string? error, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(error) || string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(state)) return Redirect($"{_options.FrontendRedirectUri}?spotify=denied");
        try { await _service.CompleteAuthorizationAsync(state, code, cancellationToken); return Redirect($"{_options.FrontendRedirectUri}?spotify=connected"); }
        catch (InvalidOperationException) { return Redirect($"{_options.FrontendRedirectUri}?spotify=error"); }
    }

    [Authorize]
    [HttpGet("connection")]
    public async Task<IActionResult> Connection() => Ok(new { connected = await _service.IsConnectedAsync(UserId()) });

    [Authorize]
    [HttpDelete("connection")]
    public async Task<IActionResult> Disconnect() { await _service.DisconnectAsync(UserId()); return NoContent(); }

    [Authorize]
    [HttpGet("currently-playing")]
    public async Task<IActionResult> CurrentlyPlaying(CancellationToken cancellationToken) => Content(await _service.GetCurrentlyPlayingAsync(UserId(), cancellationToken) ?? "null", "application/json");

    [Authorize]
    [HttpGet("playlists")]
    public async Task<IActionResult> Playlists(CancellationToken cancellationToken) => Content(await _service.GetPlaylistsAsync(UserId(), cancellationToken), "application/json");

    private int UserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst(JwtRegisteredClaimNames.Sub);
        return claim is not null && int.TryParse(claim.Value, out var id) ? id : throw new UnauthorizedAccessException();
    }
}
