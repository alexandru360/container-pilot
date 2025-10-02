using Serilog;
using Serilog.Events;
using ContainerPilot.Server.Services;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:yyyy-MM-ddTHH:mm:ss.fff}] [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        "/app/logs/container-pilot.log",
        rollingInterval: RollingInterval.Day,
        outputTemplate: "[{Timestamp:yyyy-MM-ddTHH:mm:ss.fff}] [{Level:u3}] {Message:lj}{NewLine}{Exception}",
        shared: true,
        flushToDiskInterval: TimeSpan.FromSeconds(1))
    .CreateLogger();

try
{
    Log.Information("=".PadRight(60, '='));
    Log.Information("🚀 Starting Container Pilot Application");
    Log.Information("=".PadRight(60, '='));

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddControllers();
    builder.Services.AddEndpointsApiExplorer();
    // builder.Services.AddSwaggerGen(); // Disabled temporarily

    // Add CORS
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });

    // Register Docker Service
    builder.Services.AddSingleton<IDockerService, DockerService>();

    // Add Health Checks
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        // app.UseSwagger(); // Disabled temporarily
        // app.UseSwaggerUI(); // Disabled temporarily
    }

    // Request logging middleware
    app.Use(async (context, next) =>
    {
        var timestamp = DateTime.UtcNow;
        Log.Information("[{Timestamp}] [SERVER] {Method} {Path}", 
            timestamp, context.Request.Method, context.Request.Path);
        
        await next();
        
        Log.Information("[{Timestamp}] [SERVER] {Method} {Path} -> {StatusCode}", 
            timestamp, context.Request.Method, context.Request.Path, context.Response.StatusCode);
    });

    app.UseCors();
    app.UseHttpsRedirection();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/api/health");

    // Serve static files from wwwroot (React build output)
    app.UseStaticFiles();
    app.UseRouting();

    // Fallback to index.html for SPA routing
    app.MapFallbackToFile("index.html");

    var port = builder.Configuration["Port"] ?? "5000";
    var dockerImages = builder.Configuration["DockerImages"] ?? "none";
    var dockerHost = builder.Configuration["DockerHost"] ?? "/var/run/docker.sock (default)";

    Log.Information("=".PadRight(60, '='));
    Log.Information("📦 Configured containers: {DockerImages}", dockerImages);
    Log.Information("🐋 Docker host: {DockerHost}", dockerHost);
    Log.Information("🌍 Environment: {Environment}", app.Environment.EnvironmentName);
    Log.Information("🔊 Port: {Port}", port);
    Log.Information("📅 Started at: {Timestamp}", DateTime.UtcNow);
    Log.Information("=".PadRight(60, '='));

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
