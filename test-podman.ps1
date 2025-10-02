# Script PowerShell pentru testare Podman cu Container Pilot pe Windows
# Acest script configurează și testează Container Pilot cu Podman pe Windows

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Container Pilot - Podman Test Setup (Windows)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Funcție pentru a verifica dacă Podman este instalat
function Test-Podman {
    Write-Host "[1/6] Verificare Podman..." -ForegroundColor Yellow
    
    try {
        $version = podman --version
        Write-Host "✓ $version" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "✗ Podman nu este instalat!" -ForegroundColor Red
        Write-Host "Instalează Podman Desktop: https://podman-desktop.io/" -ForegroundColor Yellow
        return $false
    }
}

# Funcție pentru a detecta calea socket-ului Podman (WSL2)
function Get-PodmanSocket {
    Write-Host "[2/6] Detectare socket Podman..." -ForegroundColor Yellow
    
    # Pe Windows, Podman rulează în WSL2
    # Socket-ul este de obicei în /mnt/wslg/runtime-dir/podman/podman.sock
    # sau /run/user/1000/podman/podman.sock în WSL
    
    $possibleSockets = @(
        "\\wsl$\Ubuntu\run\podman\podman.sock",
        "\\wsl$\Ubuntu\mnt\wslg\runtime-dir\podman\podman.sock",
        "\\wsl$\podman-machine-default\run\podman\podman.sock"
    )
    
    foreach ($socket in $possibleSockets) {
        if (Test-Path $socket) {
            Write-Host "✓ Socket Podman găsit: $socket" -ForegroundColor Green
            return $socket
        }
    }
    
    Write-Host "⚠ Socket Podman nu a fost detectat automat" -ForegroundColor Yellow
    Write-Host "Pe Windows, Podman rulează în WSL2" -ForegroundColor Cyan
    Write-Host "Socket-ul va fi montat direct în container prin Podman" -ForegroundColor Cyan
    return $null
}

# Funcție pentru a crea containere de test
function New-TestContainers {
    Write-Host "[3/6] Creare containere de test..." -ForegroundColor Yellow
    
    # Container Nginx de test
    $nginxExists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^test-nginx$" -Quiet
    if (-not $nginxExists) {
        Write-Host "Creez container test-nginx..." -ForegroundColor Cyan
        podman run -d --name test-nginx -p 8080:80 nginx:alpine | Out-Null
        Write-Host "✓ test-nginx creat" -ForegroundColor Green
    }
    else {
        Write-Host "Container test-nginx există deja" -ForegroundColor Gray
    }
    
    # Container Alpine de test (pentru logs)
    $alpineExists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^test-alpine$" -Quiet
    if (-not $alpineExists) {
        Write-Host "Creez container test-alpine..." -ForegroundColor Cyan
        podman run -d --name test-alpine alpine:latest sh -c "while true; do echo 'Test log: `$(date)'; sleep 10; done" | Out-Null
        Write-Host "✓ test-alpine creat" -ForegroundColor Green
    }
    else {
        Write-Host "Container test-alpine există deja" -ForegroundColor Gray
    }
}

# Funcție pentru a construi imaginea
function Build-Image {
    Write-Host "[4/6] Construire imagine Container Pilot..." -ForegroundColor Yellow
    
    try {
        podman build -t container-pilot:latest .
        Write-Host "✓ Imagine construită cu succes" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Eroare la construirea imaginii" -ForegroundColor Red
        throw
    }
}

# Funcție pentru a porni Container Pilot cu Podman
function Start-ContainerPilot {
    Write-Host "[5/6] Pornire Container Pilot..." -ForegroundColor Yellow
    
    # Oprim containerul dacă există deja
    $exists = podman ps -a --format "{{.Names}}" | Select-String -Pattern "^container-pilot-podman$" -Quiet
    if ($exists) {
        Write-Host "Opresc containerul vechi..." -ForegroundColor Gray
        podman stop container-pilot-podman 2>$null | Out-Null
        podman rm container-pilot-podman 2>$null | Out-Null
    }
    
    # Pe Windows/Podman, folosim --privileged pentru acces la socket
    # Podman Desktop configurează automat socket-ul în WSL2
    Write-Host "Pornesc containerul (acces la Podman socket)..." -ForegroundColor Cyan
    
    podman run -d `
        --name container-pilot-podman `
        -p 5000:5000 `
        --privileged `
        -v /run/podman/podman.sock:/var/run/docker.sock:rw `
        -e ASPNETCORE_ENVIRONMENT=Production `
        -e DockerHost=unix:///var/run/docker.sock `
        -e DockerImages=test-nginx,test-alpine `
        container-pilot:latest | Out-Null
    
    Write-Host "✓ Container Pilot pornit" -ForegroundColor Green
}

# Funcție pentru a testa aplicația
function Test-Application {
    Write-Host "[6/6] Testare aplicație..." -ForegroundColor Yellow
    
    Write-Host "Aștept 8 secunde pentru pornirea aplicației..." -ForegroundColor Gray
    Start-Sleep -Seconds 8
    
    # Test health check
    Write-Host -NoNewline "Health Check: "
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ OK" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✗ FAILED" -ForegroundColor Red
    }
    
    # Test container status
    Write-Host -NoNewline "Container Status: "
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/containers/status" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ OK" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "✗ FAILED" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Container Pilot este activ!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Dashboard: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "📊 API Health: http://localhost:5000/api/health" -ForegroundColor Cyan
    Write-Host "📦 Containers: http://localhost:5000/api/containers/status" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Containere de test disponibile:" -ForegroundColor Yellow
    Write-Host "  - test-nginx (port 8080)" -ForegroundColor Gray
    Write-Host "  - test-alpine (logs demo)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Comenzi utile:" -ForegroundColor Yellow
    Write-Host "  podman logs -f container-pilot-podman    # Vezi log-urile" -ForegroundColor Gray
    Write-Host "  podman stop container-pilot-podman       # Oprește" -ForegroundColor Gray
    Write-Host "  podman ps -a                             # Listează toate containerele" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
try {
    if (-not (Test-Podman)) {
        exit 1
    }
    
    Write-Host ""
    Get-PodmanSocket | Out-Null
    
    Write-Host ""
    New-TestContainers
    
    Write-Host ""
    Build-Image
    
    Write-Host ""
    Start-ContainerPilot
    
    Write-Host ""
    Test-Application
}
catch {
    Write-Host ""
    Write-Host "❌ Eroare: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pentru debugging, rulează:" -ForegroundColor Yellow
    Write-Host "  podman logs container-pilot-podman" -ForegroundColor Gray
    exit 1
}
