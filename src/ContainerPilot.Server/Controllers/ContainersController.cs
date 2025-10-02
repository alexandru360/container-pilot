using Microsoft.AspNetCore.Mvc;
using ContainerPilot.Server.Services;

namespace ContainerPilot.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContainersController : ControllerBase
{
    private readonly IDockerService _dockerService;
    private readonly ILogger<ContainersController> _logger;
    private readonly IConfiguration _configuration;

    public ContainersController(
        IDockerService dockerService,
        ILogger<ContainersController> logger,
        IConfiguration configuration)
    {
        _dockerService = dockerService;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var timestamp = DateTime.UtcNow;
        _logger.LogInformation("[{Timestamp}] [CONTAINERS] ========== GET STATUS ==========", timestamp);

        try
        {
            var dockerImages = _configuration["DockerImages"] ?? "";
            _logger.LogInformation("[{Timestamp}] [CONTAINERS] Configured containers: {DockerImages}", timestamp, dockerImages);

            var containers = await _dockerService.GetContainersAsync(dockerImages);
            
            _logger.LogInformation("[{Timestamp}] [CONTAINERS] Returning {Count} containers", timestamp, containers.Count);

            return Ok(new
            {
                containers,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] [CONTAINERS] Error getting status", timestamp);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("control")]
    public async Task<IActionResult> Control([FromBody] Models.ControlRequest request)
    {
        var timestamp = DateTime.UtcNow;
        _logger.LogInformation("[{Timestamp}] [CONTAINERS] Control action: {Action} on {ContainerId}", 
            timestamp, request.Action, request.ContainerId);

        try
        {
            bool result = request.Action.ToLower() switch
            {
                "start" => await _dockerService.StartContainerAsync(request.ContainerId),
                "stop" => await _dockerService.StopContainerAsync(request.ContainerId),
                "restart" => await _dockerService.RestartContainerAsync(request.ContainerId),
                _ => throw new ArgumentException($"Invalid action: {request.Action}")
            };

            return Ok(new
            {
                success = result,
                message = $"Container {request.Action} {(result ? "successful" : "failed")}",
                containerId = request.ContainerId,
                action = request.Action
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] [CONTAINERS] Error executing control action", timestamp);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("update")]
    public async Task<IActionResult> Update([FromBody] Models.UpdateRequest request)
    {
        var timestamp = DateTime.UtcNow;
        _logger.LogInformation("[{Timestamp}] [CONTAINERS] Update requested for: {ContainerId}", 
            timestamp, request.ContainerId);

        try
        {
            var result = await _dockerService.UpdateContainerAsync(request.ContainerId);
            
            return Ok(new
            {
                success = result,
                message = result ? "Container updated successfully" : "Container update failed",
                containerId = request.ContainerId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{Timestamp}] [CONTAINERS] Error updating container", timestamp);
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
