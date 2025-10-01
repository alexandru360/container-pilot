import Docker from 'dockerode';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getDockerClient() {
  const dockerHost = process.env.DOCKER_HOST;
  
  if (dockerHost) {
    console.log('Using DOCKER_HOST:', dockerHost);
    
    if (dockerHost.startsWith('http://')) {
      const url = new URL(dockerHost);
      return new Docker({
        host: url.hostname,
        port: url.port || 80,
        protocol: 'http'
      });
    } else if (dockerHost.startsWith('https://')) {
      const url = new URL(dockerHost);
      return new Docker({
        host: url.hostname,
        port: url.port || 443,
        protocol: 'https'
      });
    } else if (dockerHost.startsWith('unix://')) {
      return new Docker({
        socketPath: dockerHost.replace('unix://', '')
      });
    }
  }
  
  return new Docker({ socketPath: '/var/run/docker.sock' });
}

export async function POST(request) {
  try {
    const { containerId } = await request.json();

    if (!containerId) {
      return Response.json(
        { error: 'containerId is required' },
        { status: 400 }
      );
    }

    const docker = getDockerClient();
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();
    
    const currentImage = containerInfo.Config.Image;
    const imageName = currentImage.includes(':') 
      ? currentImage.split(':')[0] 
      : currentImage;
    const currentTag = currentImage.includes(':') 
      ? currentImage.split(':')[1] 
      : 'latest';

    console.log(`Checking updates for ${imageName}:${currentTag}`);

    // Pull the latest image info without downloading
    const image = docker.getImage(`${imageName}:${currentTag}`);
    
    // Get current image ID
    const currentImageId = containerInfo.Image;
    
    // Try to get remote image digest
    let hasUpdate = false;
    let remoteDigest = null;
    let localDigest = null;
    let updateAvailable = 'unknown';

    try {
      // Get local image info
      const localImageInfo = await docker.getImage(currentImageId).inspect();
      localDigest = localImageInfo.RepoDigests && localImageInfo.RepoDigests.length > 0 
        ? localImageInfo.RepoDigests[0] 
        : null;

      // Try to get remote image info by pulling manifest (lightweight)
      // This is a simple check - in production you'd want to use registry API
      const distribution = await image.distribution();
      remoteDigest = distribution.Descriptor?.digest || null;

      if (localDigest && remoteDigest) {
        hasUpdate = !localDigest.includes(remoteDigest);
        updateAvailable = hasUpdate ? 'available' : 'up-to-date';
      } else {
        // Fallback: compare by creation date
        const createdAt = new Date(containerInfo.Created);
        const now = new Date();
        const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);
        
        // If container is older than 7 days, suggest checking for updates
        if (daysSinceCreated > 7) {
          updateAvailable = 'check-recommended';
        } else {
          updateAvailable = 'recently-created';
        }
      }
    } catch (err) {
      console.error('Error checking remote image:', err.message);
      updateAvailable = 'check-failed';
    }

    return Response.json({
      success: true,
      containerId,
      containerName: containerInfo.Name.replace('/', ''),
      currentImage,
      imageName,
      currentTag,
      currentImageId: currentImageId.replace('sha256:', '').substring(0, 12),
      localDigest,
      remoteDigest,
      updateAvailable,
      hasUpdate,
      createdAt: containerInfo.Created,
      message: hasUpdate 
        ? '🆕 Update available! New version found.' 
        : updateAvailable === 'up-to-date'
        ? '✅ Up to date! Running latest version.'
        : updateAvailable === 'check-recommended'
        ? '⚠️ Container is old, check recommended.'
        : updateAvailable === 'recently-created'
        ? '✅ Recently created, likely up to date.'
        : '❓ Could not verify update status.'
    });

  } catch (error) {
    console.error('Check update error:', error);
    return Response.json(
      { 
        error: 'Failed to check for updates',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
