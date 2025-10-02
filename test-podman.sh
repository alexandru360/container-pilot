#!/bin/bash

# Script pentru testare Podman cu Container Pilot
# Acest script configurează și testează Container Pilot cu Podman

set -e

echo "========================================="
echo "Container Pilot - Podman Test Setup"
echo "========================================="
echo ""

# Culori pentru output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funcție pentru a detecta calea socket-ului Podman
detect_podman_socket() {
    echo -e "${YELLOW}[1/6] Detectare socket Podman...${NC}"
    
    # Încercăm mai multe locații posibile
    POSSIBLE_SOCKETS=(
        "/run/podman/podman.sock"
        "/run/user/$UID/podman/podman.sock"
        "$XDG_RUNTIME_DIR/podman/podman.sock"
        "/mnt/wslg/runtime-dir/podman/podman.sock"
    )
    
    for socket in "${POSSIBLE_SOCKETS[@]}"; do
        if [ -S "$socket" ]; then
            echo -e "${GREEN}✓ Socket Podman găsit: $socket${NC}"
            PODMAN_SOCKET="$socket"
            return 0
        fi
    done
    
    echo -e "${RED}✗ Socket Podman nu a fost găsit!${NC}"
    echo "Pornește serviciul Podman:"
    echo "  systemctl --user start podman.socket"
    echo "sau"
    echo "  podman system service --time=0 unix://$XDG_RUNTIME_DIR/podman/podman.sock &"
    exit 1
}

# Funcție pentru a verifica dacă Podman este instalat
check_podman() {
    if ! command -v podman &> /dev/null; then
        echo -e "${RED}✗ Podman nu este instalat!${NC}"
        echo "Instalează Podman: https://podman.io/getting-started/installation"
        exit 1
    fi
    echo -e "${GREEN}✓ Podman: $(podman --version)${NC}"
}

# Funcție pentru a crea containere de test
create_test_containers() {
    echo -e "${YELLOW}[2/6] Creare containere de test...${NC}"
    
    # Container Nginx de test
    if ! podman ps -a --format "{{.Names}}" | grep -q "^test-nginx$"; then
        echo "Creez container test-nginx..."
        podman run -d --name test-nginx -p 8080:80 nginx:alpine
        echo -e "${GREEN}✓ test-nginx creat${NC}"
    else
        echo "Container test-nginx există deja"
    fi
    
    # Container Alpine de test (pentru logs)
    if ! podman ps -a --format "{{.Names}}" | grep -q "^test-alpine$"; then
        echo "Creez container test-alpine..."
        podman run -d --name test-alpine alpine:latest sh -c "while true; do echo 'Test log: $(date)'; sleep 10; done"
        echo -e "${GREEN}✓ test-alpine creat${NC}"
    else
        echo "Container test-alpine există deja"
    fi
}

# Funcție pentru a actualiza podman-compose.yml cu socket-ul corect
update_compose_file() {
    echo -e "${YELLOW}[3/6] Actualizare podman-compose.yml...${NC}"
    
    if [ -f "podman-compose.yml" ]; then
        # Creăm o copie temporară cu socket-ul corect
        sed "s|/run/podman/podman.sock|$PODMAN_SOCKET|g" podman-compose.yml > podman-compose.tmp.yml
        mv podman-compose.tmp.yml podman-compose.yml
        echo -e "${GREEN}✓ Socket actualizat în podman-compose.yml${NC}"
    else
        echo -e "${RED}✗ Fișierul podman-compose.yml nu există!${NC}"
        exit 1
    fi
}

# Funcție pentru a construi imaginea
build_image() {
    echo -e "${YELLOW}[4/6] Construire imagine Container Pilot...${NC}"
    
    if podman build -t container-pilot:latest .; then
        echo -e "${GREEN}✓ Imagine construită cu succes${NC}"
    else
        echo -e "${RED}✗ Eroare la construirea imaginii${NC}"
        exit 1
    fi
}

# Funcție pentru a porni Container Pilot cu Podman
start_container_pilot() {
    echo -e "${YELLOW}[5/6] Pornire Container Pilot...${NC}"
    
    # Oprim containerul dacă există deja
    if podman ps -a --format "{{.Names}}" | grep -q "^container-pilot-podman$"; then
        echo "Opresc containerul vechi..."
        podman stop container-pilot-podman || true
        podman rm container-pilot-podman || true
    fi
    
    # Pornim containerul cu socket-ul Podman
    podman run -d \
        --name container-pilot-podman \
        -p 5000:5000 \
        -v "$PODMAN_SOCKET:/var/run/docker.sock:rw" \
        -e ASPNETCORE_ENVIRONMENT=Production \
        -e DockerHost=unix:///var/run/docker.sock \
        -e DockerImages=test-nginx,test-alpine \
        container-pilot:latest
    
    echo -e "${GREEN}✓ Container Pilot pornit${NC}"
}

# Funcție pentru a testa aplicația
test_application() {
    echo -e "${YELLOW}[6/6] Testare aplicație...${NC}"
    
    echo "Aștept 5 secunde pentru pornirea aplicației..."
    sleep 5
    
    # Test health check
    echo -n "Health Check: "
    if curl -s http://localhost:5000/api/health > /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
    fi
    
    # Test container status
    echo -n "Container Status: "
    if curl -s http://localhost:5000/api/containers/status > /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ FAILED${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}Container Pilot este activ!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "🌐 Dashboard: http://localhost:5000"
    echo "📊 API Health: http://localhost:5000/api/health"
    echo "📦 Containers: http://localhost:5000/api/containers/status"
    echo ""
    echo "Containere de test disponibile:"
    echo "  - test-nginx (port 8080)"
    echo "  - test-alpine (logs demo)"
    echo ""
    echo "Comenzi utile:"
    echo "  podman logs -f container-pilot-podman    # Vezi log-urile"
    echo "  podman stop container-pilot-podman       # Oprește"
    echo "  podman ps -a                             # Listează toate containerele"
    echo ""
    echo "Socket Podman montat: $PODMAN_SOCKET"
}

# Main execution
echo "Verificare Podman..."
check_podman

echo ""
detect_podman_socket

echo ""
create_test_containers

echo ""
update_compose_file

echo ""
build_image

echo ""
start_container_pilot

echo ""
test_application
