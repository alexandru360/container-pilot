# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Copy frontend package files
COPY src/ContainerPilot.Server/src/ContainerPilot.Web.Client/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY src/ContainerPilot.Server/src/ContainerPilot.Web.Client/ ./
RUN npm run build

# Stage 2: Build .NET Backend
FROM mcr.microsoft.com/dotnet/sdk:8.0.404-jammy AS backend-build
WORKDIR /app

# Copy csproj and restore dependencies
COPY src/ContainerPilot.Server/ContainerPilot.sln ./
COPY src/ContainerPilot.Server/*.csproj ./
RUN dotnet restore

# Copy all source files and build
COPY src/ContainerPilot.Server/ ./
RUN dotnet build -c Release -o /app/build

# Publish
RUN dotnet publish -c Release -o /app/publish

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0.20-jammy AS runtime
WORKDIR /app

# Install Docker CLI (optional, for health checks)
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

# Copy published backend
COPY --from=backend-build /app/publish .

# Copy React build output to wwwroot
COPY --from=frontend-build /app/frontend/dist ./wwwroot

# Create logs directory
RUN mkdir -p /app/logs

# Environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5000
ENV DockerImages=""
ENV DockerHost="unix:///var/run/docker.sock"

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

ENTRYPOINT ["dotnet", "ContainerPilot.Web.dll"]
