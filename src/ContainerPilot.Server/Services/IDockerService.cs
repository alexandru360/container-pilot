using ContainerPilot.Server.Models;

namespace ContainerPilot.Server.Services;

public interface IDockerService
{
    Task<List<ContainerInfo>> GetContainersAsync(string configuredContainers);
    Task<LogResponse> GetContainerLogsAsync(string containerId, int lines);
    Task<bool> StartContainerAsync(string containerId);
    Task<bool> StopContainerAsync(string containerId);
    Task<bool> RestartContainerAsync(string containerId);
    Task<bool> UpdateContainerAsync(string containerId);
}
