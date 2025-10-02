namespace ContainerPilot.Server.Models;

public class ControlRequest
{
    public string ContainerId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // start, stop, restart
}

public class UpdateRequest
{
    public string ContainerId { get; set; } = string.Empty;
}
