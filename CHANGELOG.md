# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Accordion Interface**: Click pe numele containerului pentru a expanda și vedea detalii și log-uri
- **Check Update Button**: Buton nou care verifică dacă există versiuni noi pentru containere fără a descărca imaginea
- **Smart Update Detection**: Folosește Docker Distribution API pentru comparare digest-uri (lightweight check)
- **Start/Stop/Restart Buttons**: Butoane contextuale în header-ul acordeonului
  - Start button - apare când containerul e oprit
  - Stop button - apare când containerul e pornit
  - Restart button - apare când containerul e pornit
- **Event Propagation Control**: Butoanele din header nu mai toggle-uiesc acordeonul când sunt apăsate
- **Update Status Display**: Alert în accordion care arată dacă există update disponibil
- **Activity Logs Icons**: Iconițe colorate pentru success/error/warning/info în activity logs
- **Container Details**: Informații detaliate în accordion (ID, State, Created, Ports)
- **Logs on Demand**: Log-urile se încarcă doar când expandezi acordeonul (performanță)
- **Refresh Logs Button**: Buton de refresh pentru log-uri în accordion
- **Loading States**: CircularProgress pentru check update și load logs
- **Tooltips**: Tooltip-uri pentru toate butoanele din header

### Changed
- **UI Layout**: De la Grid cu Cards la Accordion list (mai compact și intuitiv)
- **Log Display**: De la Dialog separat la inline în accordion
- **Button Placement**: Toate controalele într-un header compact cu IconButtons
- **Status Chips**: Mutate în header-ul acordeonului alături de numele containerului

### Removed
- **Dialog pentru Logs**: Înlocuit cu inline logs în accordion
- **Logs Button**: Înlocuit cu click pe accordion pentru a vedea log-urile
- **Card Layout**: Înlocuit cu Accordion pentru UI mai curat

### API Changes
- **New Endpoint**: `POST /api/check-update` - Verifică updates fără download
  - Input: `{ containerId: "abc123" }`
  - Output: `{ hasUpdate: true/false, updateAvailable: "status", message: "..." }`
- **Status Values**: `available`, `up-to-date`, `check-recommended`, `recently-created`, `check-failed`, `unknown`

### Technical Improvements
- **Docker Distribution API**: Folosește `image.distribution()` pentru manifest digest
- **Fallback Mechanism**: Dacă digest check eșuează, folosește creation date (>7 days = check recommended)
- **Better State Management**: Separate state pentru `checkingUpdate` și `updateStatus`
- **Event Handling**: `stopPropagation()` pentru butoanele din accordion header
- **Performance**: Lazy loading pentru logs (load only when expanded)

### Documentation
- **README.md**: Actualizat cu noile features și API endpoints
- **CHECK-UPDATE.md**: Documentație completă despre cum funcționează feature-ul
- **UNRAID-SETUP.md**: Ghid de deployment pentru Unraid (existent)

## [1.0.0] - 2025-10-01

### Added
- Initial release
- Docker container update functionality
- Socket.IO real-time logs
- Material-UI interface
- Container status monitoring (running/stopped/paused)
- Start/Stop/Restart controls
- Container logs viewer
- DOCKER_HOST support (unix/http/https)
- GitHub Actions CI/CD
- Multi-stage Docker build
- Unraid deployment guide

### Features
- Update all containers with one click
- Real-time WebSocket logs during updates
- Container status cards with color-coded chips
- Activity logs with operation history
- Auto-refresh status every 10 seconds
- Environment variable runtime reading (no build-time caching)

### Docker
- Multi-stage build (deps → builder → runner)
- Runs as root for Docker socket access
- Requires `--privileged` flag for socket mount
- Health check endpoint
- Standalone output for minimal image size

### API Endpoints
- `GET /api/config` - Get configured containers
- `GET /api/status` - Get container statuses
- `POST /api/control` - Start/stop/restart containers
- `GET /api/logs` - Get container logs
- `POST /api/update` - Trigger container updates
- `GET /api/health` - Health check

[Unreleased]: https://github.com/alexandru360/lottery-tools/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/alexandru360/lottery-tools/releases/tag/v1.0.0
