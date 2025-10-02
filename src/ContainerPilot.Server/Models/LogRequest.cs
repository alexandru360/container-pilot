namespace ContainerPilot.Server.Models;

public class LogRequest
{
    public string ContainerId { get; set; } = string.Empty;
    public int Lines { get; set; } = 100;
}

public class LogResponse
{
    public string ContainerId { get; set; } = string.Empty;
    public string Logs { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
