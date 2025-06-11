using AuraLogbook.Api.Repositories;
using Microsoft.AspNetCore.Mvc;
namespace AuraLogbook.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthCheckController : ControllerBase
{
    private readonly HealthCheckRepository _repo;

    public HealthCheckController(HealthCheckRepository repo)
    {
        _repo = repo;
    }

    [HttpGet]
    public async Task<IActionResult> Get() =>
        await _repo.CanConnectAsync() ? Ok("DB Connected") : StatusCode(500, "DB Failed");
}
