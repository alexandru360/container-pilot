# Container Pilot Diagnostic Script (PowerShell version)
# Run this on your Windows server to diagnose the 500 error

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Container Pilot Diagnostic Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if container is running
Write-Host "1. Checking if container-pilot is running..." -ForegroundColor Yellow
$containerCheck = docker ps --format '{{.Names}}' | Select-String "container-pilot"
if ($containerCheck) {
    Write-Host "✓ container-pilot is running" -ForegroundColor Green
    $containerId = docker ps --filter "name=container-pilot" --format '{{.ID}}'
    Write-Host "   Container ID: $containerId" -ForegroundColor Gray
} else {
    Write-Host "✗ container-pilot is NOT running" -ForegroundColor Red
    Write-Host "   Start it with: docker start container-pilot" -ForegroundColor Yellow
    Write-Host "   Or deploy it following DEPLOYMENT-CHECKLIST.md" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Checking environment variables..." -ForegroundColor Yellow
$dockerImages = docker exec $containerId sh -c 'echo $DOCKER_IMAGES' 2>$null
$dockerHost = docker exec $containerId sh -c 'echo $DOCKER_HOST' 2>$null

if ([string]::IsNullOrWhiteSpace($dockerImages)) {
    Write-Host "✗ DOCKER_IMAGES is NOT set" -ForegroundColor Red
    Write-Host "   This is why you see 'No containers configured'" -ForegroundColor Yellow
    Write-Host "   Fix: Recreate container with -e DOCKER_IMAGES=container1,container2" -ForegroundColor Yellow
} else {
    Write-Host "✓ DOCKER_IMAGES is set" -ForegroundColor Green
    Write-Host "   Value: $dockerImages" -ForegroundColor Gray
}

if ([string]::IsNullOrWhiteSpace($dockerHost)) {
    Write-Host "ℹ DOCKER_HOST not set (using default /var/run/docker.sock)" -ForegroundColor Blue
} else {
    Write-Host "✓ DOCKER_HOST is set" -ForegroundColor Green
    Write-Host "   Value: $dockerHost" -ForegroundColor Gray
}

Write-Host ""
Write-Host "3. Checking Docker socket mount..." -ForegroundColor Yellow
$socketCheck = docker exec $containerId sh -c 'test -S /var/run/docker.sock' 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker socket is mounted" -ForegroundColor Green
    $socketPerms = docker exec $containerId sh -c 'ls -la /var/run/docker.sock' 2>$null
    Write-Host "   $socketPerms" -ForegroundColor Gray
} else {
    Write-Host "✗ Docker socket is NOT mounted or not accessible" -ForegroundColor Red
    Write-Host "   This is causing the 500 error on /api/status" -ForegroundColor Yellow
    Write-Host "   Fix: Add volume mount: -v /var/run/docker.sock:/var/run/docker.sock" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "4. Testing Docker socket access from container..." -ForegroundColor Yellow
$dockerTest = docker exec $containerId sh -c 'ls /var/run/docker.sock' 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Container can see Docker socket" -ForegroundColor Green
} else {
    Write-Host "✗ Container cannot access Docker socket" -ForegroundColor Red
    Write-Host "   Error: $dockerTest" -ForegroundColor Yellow
    Write-Host "   This is causing the 500 error" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "5. Checking recent container logs..." -ForegroundColor Yellow
Write-Host "   Last 20 lines:" -ForegroundColor Gray
Write-Host "   -------------" -ForegroundColor Gray
$logs = docker logs --tail 20 $containerId 2>&1
$logs | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }

Write-Host ""
Write-Host "6. Testing API endpoints..." -ForegroundColor Yellow

# Test config endpoint
Write-Host "   Testing /api/config..." -ForegroundColor Gray
try {
    $configResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/config" -UseBasicParsing -ErrorAction Stop
    if ($configResponse.StatusCode -eq 200 -and $configResponse.Content -like "*containers*") {
        Write-Host "   ✓ Config endpoint working" -ForegroundColor Green
        Write-Host "     $($configResponse.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Config endpoint failed" -ForegroundColor Red
        Write-Host "   Response: $($configResponse.Content)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ✗ Config endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "   Testing /api/status..." -ForegroundColor Gray
try {
    $statusResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/status" -UseBasicParsing -ErrorAction Stop
    if ($statusResponse.StatusCode -eq 200) {
        Write-Host "   ✓ Status endpoint working (HTTP $($statusResponse.StatusCode))" -ForegroundColor Green
        Write-Host "     $($statusResponse.Content)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ Status endpoint failed (HTTP $($statusResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Status endpoint failed (HTTP $($_.Exception.Response.StatusCode.value__))" -ForegroundColor Red
    Write-Host "   This is the error you're seeing in the browser" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error details:" -ForegroundColor Yellow
        Write-Host "     $errorBody" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "7. Checking container stats..." -ForegroundColor Yellow
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $containerId

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Diagnostic Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Provide summary and recommendations
if ([string]::IsNullOrWhiteSpace($dockerImages)) {
    Write-Host ""
    Write-Host "CRITICAL: DOCKER_IMAGES environment variable is missing" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this, you need to recreate the container with the correct environment variable:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Stop and remove the current container:" -ForegroundColor Yellow
    Write-Host "   docker stop container-pilot"
    Write-Host "   docker rm container-pilot"
    Write-Host ""
    Write-Host "2. Run with proper environment variables:" -ForegroundColor Yellow
    Write-Host "   docker run -d \"
    Write-Host "     --name container-pilot \"
    Write-Host "     -p 3000:3000 \"
    Write-Host "     -v /var/run/docker.sock:/var/run/docker.sock \"
    Write-Host "     -e DOCKER_IMAGES=lottery-nginx,lottery-dotnet \"
    Write-Host "     -e PORT=3000 \"
    Write-Host "     -e NODE_ENV=production \"
    Write-Host "     --restart unless-stopped \"
    Write-Host "     your-registry/container-pilot:latest"
    Write-Host ""
} elseif ($socketCheck -eq $null -or $LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "CRITICAL: Docker socket is not mounted or not accessible" -ForegroundColor Red
    Write-Host ""
    Write-Host "To fix this, you need to recreate the container with the socket mounted:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Stop and remove the current container:" -ForegroundColor Yellow
    Write-Host "   docker stop container-pilot"
    Write-Host "   docker rm container-pilot"
    Write-Host ""
    Write-Host "2. Run with Docker socket mounted:" -ForegroundColor Yellow
    Write-Host "   docker run -d \"
    Write-Host "     --name container-pilot \"
    Write-Host "     -p 3000:3000 \"
    Write-Host "     -v /var/run/docker.sock:/var/run/docker.sock \"
    Write-Host "     -e DOCKER_IMAGES=$dockerImages \"
    Write-Host "     -e PORT=3000 \"
    Write-Host "     -e NODE_ENV=production \"
    Write-Host "     --restart unless-stopped \"
    Write-Host "     your-registry/container-pilot:latest"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Check the status endpoint result above." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Permission denied on Docker socket" -ForegroundColor Gray
    Write-Host "  - Docker daemon not running" -ForegroundColor Gray
    Write-Host "  - Network connectivity issues" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try viewing full logs with:" -ForegroundColor Yellow
    Write-Host "   docker logs -f container-pilot"
    Write-Host ""
}

Write-Host ""
Write-Host "For more help, see:" -ForegroundColor Cyan
Write-Host "  - TROUBLESHOOTING.md"
Write-Host "  - DEPLOYMENT-CHECKLIST.md"
Write-Host ""
