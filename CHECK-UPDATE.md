# Check Update Feature - How It Works

## Overview
The Check Update feature allows you to verify if a newer version of a container's image is available without actually downloading it.

## How It Works

### 1. Get Current Container Info
```javascript
const containerInfo = await container.inspect();
const currentImage = containerInfo.Config.Image; // e.g., "nginx:latest"
const currentImageId = containerInfo.Image;      // e.g., "sha256:abc123..."
```

### 2. Parse Image Name and Tag
```javascript
const imageName = currentImage.includes(':') 
  ? currentImage.split(':')[0]  // "nginx"
  : currentImage;
  
const currentTag = currentImage.includes(':') 
  ? currentImage.split(':')[1]  // "latest"
  : 'latest';
```

### 3. Compare Image Digests

#### Method A: Using Distribution API (Preferred)
```javascript
const image = docker.getImage(`${imageName}:${currentTag}`);
const distribution = await image.distribution();
const remoteDigest = distribution.Descriptor?.digest;
```

The distribution API provides the image manifest digest WITHOUT downloading the entire image:
- **Local digest**: `sha256:abc123def456...` (from local image)
- **Remote digest**: `sha256:xyz789ghi012...` (from registry)
- **If different**: Update available ✅
- **If same**: Up to date 🎯

#### Method B: Fallback - Creation Date Check
If digest comparison fails, we check the container's age:
```javascript
const createdAt = new Date(containerInfo.Created);
const now = new Date();
const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);

if (daysSinceCreated > 7) {
  updateAvailable = 'check-recommended';
}
```

## Response Statuses

### `available` 🆕
- **Meaning**: New version found in registry
- **Action**: User should update the container
- **Icon**: Orange warning chip
- **Message**: "🆕 Update available! New version found."

### `up-to-date` ✅
- **Meaning**: Running the latest version
- **Action**: No update needed
- **Icon**: Green success chip
- **Message**: "✅ Up to date! Running latest version."

### `check-recommended` ⚠️
- **Meaning**: Container created >7 days ago
- **Action**: Manual check recommended (digest comparison failed)
- **Icon**: Yellow info chip
- **Message**: "⚠️ Container is old, check recommended."

### `recently-created` 🕐
- **Meaning**: Container created <7 days ago
- **Action**: Likely up to date
- **Icon**: Blue info chip
- **Message**: "✅ Recently created, likely up to date."

### `check-failed` ❌
- **Meaning**: Cannot verify (network/API error)
- **Action**: Try again later
- **Icon**: Red error chip
- **Message**: "❓ Could not verify update status."

### `unknown` ❓
- **Meaning**: Unexpected state
- **Action**: Investigate logs
- **Icon**: Default chip
- **Message**: "❓ Could not verify update status."

## Example API Response

```json
{
  "success": true,
  "containerId": "8e14d924cd99",
  "containerName": "ollama",
  "currentImage": "ollama/ollama:latest",
  "imageName": "ollama/ollama",
  "currentTag": "latest",
  "currentImageId": "8e14d924cd99",
  "localDigest": "sha256:abc123def456789...",
  "remoteDigest": "sha256:xyz789ghi012345...",
  "updateAvailable": "available",
  "hasUpdate": true,
  "createdAt": "2025-09-15T10:30:00.000Z",
  "message": "🆕 Update available! New version found."
}
```

## Technical Limitations

### 1. Private Registries
If your image is in a private registry (e.g., GitLab, Harbor), the distribution API may require authentication:
- **Solution**: Add Docker registry credentials to the host
- **Alternative**: Use `docker login` before running the updater

### 2. Rate Limiting
Docker Hub has rate limits (100 pulls/6h for anonymous, 200/6h for free users):
- **Solution**: Use Docker Hub authentication
- **Note**: Distribution API calls don't count as pulls (they're HEAD requests)

### 3. Multi-Arch Images
Some images have different digests per architecture (amd64, arm64):
- **Current behavior**: Compares digest for the current platform
- **Future enhancement**: Could show updates for all platforms

### 4. Floating Tags (`:latest`)
Images with floating tags may update frequently:
- **Behavior**: Will show update if remote digest changes
- **Recommendation**: Use specific version tags (`:1.2.3`) in production

## Performance Considerations

### Lightweight Check
The distribution API only fetches the image manifest (~2-5KB), not the entire image (which can be GB):
- **Network**: Minimal bandwidth usage
- **Speed**: Usually <500ms per container
- **Storage**: No disk space used

### Caching
Currently, the check runs on-demand (no caching). Future enhancements:
- Cache digests for X minutes
- Background polling every N hours
- Webhook notifications from registry

## Security Notes

### Digest Verification
Using digests (sha256) ensures:
- **Integrity**: The image hasn't been tampered with
- **Reproducibility**: Same digest = same image content
- **Security**: Prevents MITM attacks during update checks

### Socket Permissions
The check-update API requires Docker socket access:
- **Container must run with**: `--privileged` flag OR
- **Alternative**: Use Docker Remote API (HTTP/HTTPS)

## Usage in UI

### Accordion Header
Each container has a "🔍 Check Update" button in the accordion header:
```jsx
<IconButton
  onClick={(e) => handleCheckUpdate(container.id, container.name, e)}
  disabled={checkingUpdate[container.id]}
>
  {checkingUpdate[container.id] ? (
    <CircularProgress size={20} />
  ) : (
    <UpdateCheckIcon />
  )}
</IconButton>
```

### Event Propagation
The button click event is prevented from bubbling to the accordion:
```javascript
onClick={(e) => {
  e.stopPropagation(); // Don't toggle accordion
  handleCheckUpdate(containerId, containerName, e);
}}
```

### Result Display
After checking, an Alert is shown in the accordion details:
```jsx
{updateStatus[container.id] && (
  <Alert severity={updateStatus[container.id].hasUpdate ? 'warning' : 'success'}>
    {updateStatus[container.id].message}
  </Alert>
)}
```

## Future Enhancements

1. **Auto-check on load**: Check all containers when page loads
2. **Scheduled checks**: Background job every X hours
3. **Notifications**: Browser/email notifications when updates available
4. **Bulk update**: Update all containers with available updates at once
5. **Changelog display**: Show what changed in the new version
6. **Rollback support**: Keep previous image for quick rollback
7. **Update scheduling**: Schedule updates for off-peak hours
8. **Dependency management**: Update containers in correct order

## Troubleshooting

### "check-failed" Status
**Causes:**
- Registry unreachable (network issue)
- Rate limiting (Docker Hub)
- Private registry without auth
- Invalid image name/tag

**Solutions:**
- Check network connectivity
- Verify image exists: `docker pull <image>:<tag>`
- Add registry authentication
- Check Docker daemon logs

### "check-recommended" Always Shows
**Cause:** Digest comparison consistently fails

**Solutions:**
- Check Docker version (needs distribution API support)
- Verify registry supports manifest API
- Try using Remote API instead of socket

### Check Takes Too Long
**Causes:**
- Slow registry connection
- Large manifest size (rare)

**Solutions:**
- Use closer registry mirror
- Check network latency
- Consider caching results
