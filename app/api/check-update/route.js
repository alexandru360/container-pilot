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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CHECK-UPDATE] ========== NEW REQUEST ==========`);
  
  try {
    console.log(`[${timestamp}] [CHECK-UPDATE] Parsing request body...`);
    const { containerId } = await request.json();

    console.log(`[${timestamp}] [CHECK-UPDATE] Container ID:`, containerId);

    if (!containerId) {
      console.error(`[${timestamp}] [CHECK-UPDATE] ERROR: No container ID provided`);
      return Response.json(
        { error: 'containerId is required' },
        { status: 400 }
      );
    }

    console.log(`[${timestamp}] [CHECK-UPDATE] Initializing Docker client...`);
    const docker = getDockerClient();
    
    console.log(`[${timestamp}] [CHECK-UPDATE] Getting container object...`);
    const container = docker.getContainer(containerId);
    
    console.log(`[${timestamp}] [CHECK-UPDATE] Inspecting container to get image info...`);
    const containerInfo = await container.inspect();
    
    const currentImage = containerInfo.Config.Image;
    console.log(`[${timestamp}] [CHECK-UPDATE] Current image:`, currentImage);
    
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
      console.log('[CHECK-UPDATE] Getting local image info...');
      const localImageInfo = await docker.getImage(currentImageId).inspect();
      localDigest = localImageInfo.RepoDigests && localImageInfo.RepoDigests.length > 0 
        ? localImageInfo.RepoDigests[0] 
        : null;

      console.log('[CHECK-UPDATE] Local digest:', localDigest);

      // Try to get remote image info by pulling manifest (lightweight)
      // This is a simple check - in production you'd want to use registry API
      console.log('[CHECK-UPDATE] Checking remote image distribution...');
      const distribution = await image.distribution();
      remoteDigest = distribution.Descriptor?.digest || null;

      console.log('[CHECK-UPDATE] Remote digest:', remoteDigest);

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
      console.error('[CHECK-UPDATE] Error checking remote image:', err.message);
      console.error('[CHECK-UPDATE] Error code:', err.code);
      console.error('[CHECK-UPDATE] Error stack:', err.stack);
      
      // Fallback: Use container age to provide helpful info
      const createdAt = new Date(containerInfo.Created);
      const now = new Date();
      const daysSinceCreated = (now - createdAt) / (1000 * 60 * 60 * 24);
      
      console.log('[CHECK-UPDATE] Container age:', daysSinceCreated.toFixed(1), 'days');
      
      if (daysSinceCreated < 1) {
        updateAvailable = 'recently-created';
      } else if (daysSinceCreated < 7) {
        updateAvailable = 'likely-current';
      } else if (daysSinceCreated < 30) {
        updateAvailable = 'check-recommended';
      } else {
        updateAvailable = 'check-recommended-old';
      }
    }

    console.log('[CHECK-UPDATE] Update status:', updateAvailable);

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
        ? '⚠️ Container is 1+ weeks old, manual check recommended.'
        : updateAvailable === 'check-recommended-old'
        ? '⚠️ Container is 1+ months old, update recommended.'
        : updateAvailable === 'recently-created'
        ? '✅ Created recently (< 24h), likely up to date.'
        : updateAvailable === 'likely-current'
        ? '✅ Created this week, likely current.'
        : '❓ Could not verify with registry. Check manually.'
    });

  } catch (error) {
    console.error('[CHECK-UPDATE] Fatal error:', error);
    console.error('[CHECK-UPDATE] Error message:', error.message);
    console.error('[CHECK-UPDATE] Error code:', error.code);
    console.error('[CHECK-UPDATE] Error stack:', error.stack);
    return Response.json(
      { 
        error: 'Failed to check for updates',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}
