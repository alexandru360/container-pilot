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
    public async Task<IActionResult> GetLogs([FromQuery] string? containerId, [FromQuery] string? container, [FromQuery] int lines = 100)
    {
        var timestamp = DateTime.UtcNow;
        _logger.LogInformation("[{Timestamp}] [LOGS] ========== GET LOGS ==========", timestamp);
        
        // If requesting self logs (Container Pilot's own logs)
        var containerName = container ?? containerId;
        if (containerName == "lottery-tools" || containerName == "container-pilot" || string.IsNullOrEmpty(containerName))
        {
            _logger.LogInformation("[{Timestamp}] [LOGS] Reading self logs from file", timestamp);
            try
            {
                var logFilePath = Path.Combine("/app/logs", "container-pilot.log");
                if (!System.IO.File.Exists(logFilePath))
                {
                    _logger.LogWarning("[{Timestamp}] [LOGS] Log file not found: {LogFilePath}", timestamp, logFilePath);
                    return Ok(new { logs = "No logs available yet. Log file will be created on first write." });
                }

                var allLines = await System.IO.File.ReadAllLinesAsync(logFilePath);
                var lastLines = allLines.TakeLast(lines);
                var logsText = string.Join("\n", lastLines);
                
                _logger.LogInformation("[{Timestamp}] [LOGS] Successfully read {Count} lines from self logs", timestamp, lastLines.Count());
                return Ok(new { logs = logsText });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[{Timestamp}] [LOGS] Error reading self logs", timestamp);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // Otherwise get container logs from Docker
        _logger.LogInformation("[{Timestamp}] [LOGS] ContainerId: {ContainerId}, Lines: {Lines}", 
            timestamp, containerName, lines);

        if (string.IsNullOrEmpty(containerName))
        {
            _logger.LogError("[{Timestamp}] [LOGS] ContainerId is required", timestamp);
            return BadRequest(new { error = "containerId or container is required" });
        }

        try
        {
            var result = await _dockerService.GetContainerLogsAsync(containerName, lines);
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
