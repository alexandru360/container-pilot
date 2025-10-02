using Microsoft.AspNetCore.Mvc;
using ContainerPilot.Server.Services;
using ContainerPilot.Server.Models;

namespace ContainerPilot.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LogsController : ControllerBase
{
    private readonly IDockerService _dockerService;
    private readonly ILogger<LogsController> _logger;

    public LogsController(IDockerService dockerService, ILogger<LogsController> logger)
    {
        _dockerService = dockerService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] string containerId, [FromQuery] int lines = 100)
    {
        var timestamp = DateTime.UtcNow;
        _logger.LogInformation("[{Timestamp}] [LOGS] ========== GET LOGS ==========", timestamp);
        _logger.LogInformation("[{Timestamp}] [LOGS] ContainerId: {ContainerId}, Lines: {Lines}", 
            timestamp, containerId, lines);

        if (string.IsNullOrEmpty(containerId))
        {
            _logger.LogError("[{Timestamp}] [LOGS] ContainerId is required", timestamp);
            return BadRequest(new { error = "containerId is required" });
        }

        try
        {
            var result = await _dockerService.GetContainerLogsAsync(containerId, lines);
            _logger.LogInformation("[{Timestamp}] [LOGS] Successfully retrieved logs", timestamp);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] [LOGS] Error getting logs", timestamp);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
