using Docker.DotNet;
using Docker.DotNet.Models;
using ContainerPilot.Server.Models;

namespace ContainerPilot.Server.Services;

public class DockerService : IDockerService
{
    private readonly DockerClient _dockerClient;
    private readonly ILogger<DockerService> _logger;

    public DockerService(ILogger<DockerService> logger, IConfiguration configuration)
    {
        _logger = logger;
        
        var dockerHost = configuration["DockerHost"] ?? "unix:///var/run/docker.sock";
        _logger.LogInformation("[DOCKER-SERVICE] Initializing Docker client with host: {DockerHost}", dockerHost);
        
        _dockerClient = new DockerClientConfiguration(new Uri(dockerHost)).CreateClient();
    }

    public async Task<List<ContainerInfo>> GetContainersAsync(string configuredContainers)
    {
        _logger.LogInformation("[DOCKER-SERVICE] Getting containers. Configured: {ConfiguredContainers}", configuredContainers);
        
        var containerNames = configuredContainers.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(n => n.Trim())
            .ToList();

        if (!containerNames.Any())
        {
            _logger.LogWarning("[DOCKER-SERVICE] No containers configured");
            return new List<ContainerInfo>();
        }

        var allContainers = await _dockerClient.Containers.ListContainersAsync(new ContainersListParameters
        {
            All = true
        });

        _logger.LogInformation("[DOCKER-SERVICE] Found {Count} containers in Docker", allContainers.Count);

        var result = new List<ContainerInfo>();

        foreach (var name in containerNames)
        {
            _logger.LogDebug("[DOCKER-SERVICE] Looking for container: {ContainerName}", name);
            
            var container = allContainers.FirstOrDefault(c => 
                c.Names.Any(n => n == $"/{name}" || n == name));

            if (container == null)
            {
                _logger.LogWarning("[DOCKER-SERVICE] Container '{ContainerName}' not found", name);
                result.Add(new ContainerInfo
                {
                    Name = name,
                    Status = "not-found",
                    State = "unknown"
                });
                continue;
            }

            _logger.LogDebug("[DOCKER-SERVICE] Container '{ContainerName}' found: {State}", name, container.State);

            result.Add(new ContainerInfo
            {
                Id = container.ID,
                Name = name,
                Image = container.Image,
                Status = container.Status,
                State = container.State,
                Created = DateTime.Parse(container.Created.ToString()),
                Ports = container.Ports.Select(p => new PortMapping
                {
                    PrivatePort = (int)p.PrivatePort,
                    PublicPort = (int)p.PublicPort,
                    Type = p.Type
                }).ToList()
            });
        }

        return result;
    }

    public async Task<LogResponse> GetContainerLogsAsync(string containerId, int lines)
    {
        _logger.LogInformation("[DOCKER-SERVICE] Getting logs for container: {ContainerId}, lines: {Lines}", containerId, lines);

        var parameters = new ContainerLogsParameters
        {
            ShowStdout = true,
            ShowStderr = true,
            Timestamps = true,
            Tail = lines.ToString()
        };

        using var stream = await _dockerClient.Containers.GetContainerLogsAsync(containerId, parameters, CancellationToken.None);
        using var reader = new StreamReader(stream);
        var logs = await reader.ReadToEndAsync();

        _logger.LogInformation("[DOCKER-SERVICE] Retrieved {Length} bytes of logs", logs.Length);

        return new LogResponse
        {
            ContainerId = containerId,
            Logs = logs,
            Timestamp = DateTime.UtcNow
        };
    }

    public async Task<bool> StartContainerAsync(string containerId)
    {
        _logger.LogInformation("[DOCKER-SERVICE] Starting container: {ContainerId}", containerId);
        
        try
        {
            await _dockerClient.Containers.StartContainerAsync(containerId, new ContainerStartParameters());
            _logger.LogInformation("[DOCKER-SERVICE] Container started successfully: {ContainerId}", containerId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DOCKER-SERVICE] Failed to start container: {ContainerId}", containerId);
            return false;
        }
    }

    public async Task<bool> StopContainerAsync(string containerId)
    {
        _logger.LogInformation("[DOCKER-SERVICE] Stopping container: {ContainerId}", containerId);
        
        try
        {
            await _dockerClient.Containers.StopContainerAsync(containerId, new ContainerStopParameters
            {
                WaitBeforeKillSeconds = 10
            });
            _logger.LogInformation("[DOCKER-SERVICE] Container stopped successfully: {ContainerId}", containerId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DOCKER-SERVICE] Failed to stop container: {ContainerId}", containerId);
            return false;
        }
    }

    public async Task<bool> RestartContainerAsync(string containerId)
    {
        _logger.LogInformation("[DOCKER-SERVICE] Restarting container: {ContainerId}", containerId);
        
        try
        {
            await _dockerClient.Containers.RestartContainerAsync(containerId, new ContainerRestartParameters
            {
                WaitBeforeKillSeconds = 10
            });
            _logger.LogInformation("[DOCKER-SERVICE] Container restarted successfully: {ContainerId}", containerId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DOCKER-SERVICE] Failed to restart container: {ContainerId}", containerId);
            return false;
        }
    }

    public async Task<bool> UpdateContainerAsync(string containerId)
    {
        _logger.LogInformation("[DOCKER-SERVICE] Starting update for container: {ContainerId}", containerId);
        
        try
        {
            // Get container info
            var containerInfo = await _dockerClient.Containers.InspectContainerAsync(containerId);
            var imageName = containerInfo.Config.Image;
            var containerName = containerInfo.Name.TrimStart('/');

            _logger.LogInformation("[DOCKER-SERVICE] Container: {Name}, Image: {Image}", containerName, imageName);

            // Pull latest image
            _logger.LogInformation("[DOCKER-SERVICE] Pulling latest image: {Image}", imageName);
            await _dockerClient.Images.CreateImageAsync(
                new ImagesCreateParameters { FromImage = imageName },
                null,
                new Progress<JSONMessage>(msg => _logger.LogDebug("[DOCKER-SERVICE] Pull: {Status}", msg.Status)));

            // Stop container
            _logger.LogInformation("[DOCKER-SERVICE] Stopping container...");
            await StopContainerAsync(containerId);

            // Remove container
            _logger.LogInformation("[DOCKER-SERVICE] Removing old container...");
            await _dockerClient.Containers.RemoveContainerAsync(containerId, new ContainerRemoveParameters());

            // Recreate container with cgroupv2-compatible settings
            _logger.LogInformation("[DOCKER-SERVICE] Recreating container...");
            
            // Create a new HostConfig without cgroupv1-specific settings
            var newHostConfig = new HostConfig
            {
                Binds = containerInfo.HostConfig.Binds,
                NetworkMode = containerInfo.HostConfig.NetworkMode,
                PortBindings = containerInfo.HostConfig.PortBindings,
                RestartPolicy = containerInfo.HostConfig.RestartPolicy,
                Privileged = containerInfo.HostConfig.Privileged,
                CapAdd = containerInfo.HostConfig.CapAdd,
                CapDrop = containerInfo.HostConfig.CapDrop,
                // Exclude MemorySwappiness and other cgroupv1-specific settings for Podman compatibility
            };
            
            var newContainer = await _dockerClient.Containers.CreateContainerAsync(new CreateContainerParameters
            {
                Name = containerName,
                Image = imageName,
                Env = containerInfo.Config.Env,
                Cmd = containerInfo.Config.Cmd,
                HostConfig = newHostConfig,
                ExposedPorts = containerInfo.Config.ExposedPorts,
                WorkingDir = containerInfo.Config.WorkingDir,
                Entrypoint = containerInfo.Config.Entrypoint,
                Labels = containerInfo.Config.Labels
            });

            // Start new container
            _logger.LogInformation("[DOCKER-SERVICE] Starting new container...");
            await _dockerClient.Containers.StartContainerAsync(newContainer.ID, new ContainerStartParameters());

            _logger.LogInformation("[DOCKER-SERVICE] Container updated successfully: {ContainerId}", newContainer.ID);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[DOCKER-SERVICE] Failed to update container: {ContainerId}", containerId);
            return false;
        }
    }
}
