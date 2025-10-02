# Container Pilot 🚀

[![CI/CD Pipeline](https://github.com/alexandru360/container-pilot/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/alexandru360/container-pilot/actions/workflows/ci-cd.yml)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/alexandru360/container-pilot/pkgs/container/container-pilot)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A modern ASP.NET Core + React Docker container management web interface with real-time updates, logs streaming, and container lifecycle control.

## 📦 Docker Image

**Pull the latest image:**
```bash
docker pull ghcr.io/alexandru360/container-pilot:latest
```

**GitHub Container Registry:**
- 🐳 [View on GitHub Packages](https://github.com/alexandru360/container-pilot/pkgs/container/container-pilot)
- 📋 [All Available Tags](https://github.com/alexandru360/container-pilot/pkgs/container/container-pilot/versions)
- 🔗 **Direct Link:** https://github.com/alexandru360/container-pilot/pkgs/container/container-pilot

## ✨ Features

- 🔄 **Real-time Updates** - Live container status with WebSocket connections
- 📊 **Container Management** - Start, stop, restart containers with a click
- 📝 **Live Logs** - Stream container logs in real-time
- 🔍 **Update Detection** - Check for new image versions
- ⬆️ **One-Click Updates** - Pull new images and recreate containers automatically
- 🎨 **Modern UI** - Material-UI responsive design
- 🔒 **Secure** - Direct Docker socket access, no external dependencies

## 🚀 Quick Start

### Docker Run

```bash
docker run -d \
  --name='container-pilot' \
  -e 'DOCKER_IMAGES'='container1,container2,container3' \
  -e 'NODE_ENV'='production' \
  -p '3000:3000/tcp' \
  -v '/var/run/docker.sock':'/var/run/docker.sock':'rw' \
  --restart unless-stopped \
  ghcr.io/alexandru360/container-pilot:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  container-pilot:
    image: ghcr.io/alexandru360/container-pilot:latest
    container_name: container-pilot
    ports:
      - "3000:3000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:rw
    environment:
      - DOCKER_IMAGES=container1,container2,container3
      - NODE_ENV=production
    restart: unless-stopped
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DOCKER_IMAGES` | Comma-separated list of container names to manage | - | ✅ Yes |
| `NODE_ENV` | Environment mode (`production` or `development`) | `development` | ❌ No |
| `PORT` | Server port | `3000` | ❌ No |
| `DOCKER_HOST` | Docker socket path or remote host | `/var/run/docker.sock` | ❌ No |

### Example Configuration

```bash
# Multiple containers
DOCKER_IMAGES=nginx,postgres,redis,app

# Remote Docker host
DOCKER_HOST=tcp://192.168.1.100:2375

# Custom port
PORT=8080
```

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) + Material-UI
- **Backend**: Node.js with custom server (server.js)
- **Real-time**: Socket.IO for live updates
- **Docker API**: Dockerode for container management
- **Build**: Multi-stage Docker build for optimized images

## 📖 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get status of all configured containers |
| `/api/logs` | GET | Fetch container logs |
| `/api/control` | POST | Start/stop/restart containers |
| `/api/check-update` | POST | Check if container image has updates |
| `/api/update-container` | POST | Update container to latest image |
| `/api/config` | GET | Get application configuration |
| `/api/health` | GET | Health check endpoint |
| `/api/socketio` | WS | WebSocket connection for real-time updates |

## 🔧 Development

### Prerequisites

- Node.js 20+
- Docker
- npm or yarn

### Local Development

```bash
# Clone repository
git clone https://github.com/alexandru360/container-pilot.git
cd container-pilot

# Install dependencies
npm install

# Set environment variables
export DOCKER_IMAGES=container1,container2
export NODE_ENV=development

# Run development server
npm run dev
```

### Build Docker Image

```bash
# Build image
docker build -t container-pilot:local .

# Run locally built image
docker run -d \
  -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock:rw \
  -e DOCKER_IMAGES=container1,container2 \
  container-pilot:local
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📊 CI/CD

This project uses GitHub Actions for:
- **CI Pipeline**: Automated testing, linting, and Docker build verification
- **Docker Build**: Multi-platform builds (amd64, arm64) on every push
- **Release**: Automatic versioned releases with semantic versioning

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Container not found
- Verify container names in `DOCKER_IMAGES` match exactly
- Check Docker socket is mounted: `-v /var/run/docker.sock:/var/run/docker.sock:rw`

### Permission denied
- Ensure Docker socket has correct permissions
- Container must run as root or user with Docker group access

### 500 Internal Server Error
- Check Docker socket is accessible
- Verify `DOCKER_IMAGES` environment variable is set
- Review container logs: `docker logs container-pilot`

### WebSocket connection failed
- Ensure port 3000 is accessible
- Check firewall rules
- Verify reverse proxy WebSocket support (if using one)

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [Socket.IO Documentation](https://socket.io/docs/)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Material-UI](https://mui.com/)
- Docker integration via [Dockerode](https://github.com/apocas/dockerode)
- Real-time updates with [Socket.IO](https://socket.io/)

---

Made with ❤️ by [alexandru360](https://github.com/alexandru360)
