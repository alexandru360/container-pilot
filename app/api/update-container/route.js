import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getSocketIO } from '@/lib/socket';

// Initialize Docker client with configurable host
function getDockerClient() {
  const dockerHost = process.env.DOCKER_HOST;
  
  if (dockerHost) {
    if (dockerHost.startsWith('http://') || dockerHost.startsWith('https://')) {
      const url = new URL(dockerHost);
      return new Docker({
        host: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 2376 : 2375),
        protocol: url.protocol.replace(':', '')
      });
    } else if (dockerHost.startsWith('unix://')) {
      return new Docker({ socketPath: dockerHost.replace('unix://', '') });
    }
  }
  
  return new Docker({ socketPath: '/var/run/docker.sock' });
}

export async function POST(request) {
  console.log('[UPDATE-CONTAINER] Starting container update request');
  
  try {
    const body = await request.json();
    const { containerId } = body;

    if (!containerId) {
      return NextResponse.json(
        { error: 'containerId is required' },
        { status: 400 }
      );
    }

    console.log(`[UPDATE-CONTAINER] Updating container: ${containerId}`);

    const docker = getDockerClient();
    const io = getSocketIO();
    const clientId = Date.now().toString();

    // Start update in background
    updateContainer(docker, io, clientId, containerId);

    return NextResponse.json({ 
      message: 'Update started',
      containerId,
      clientId
    });

  } catch (error) {
    console.error('[UPDATE-CONTAINER] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function updateContainer(docker, io, clientId, containerId) {
  const emitLog = (level, message) => {
    console.log(`[UPDATE-CONTAINER] [${level.toUpperCase()}] ${message}`);
    if (io) {
      io.emit('update-log', { 
        clientId, 
        containerId,
        level, 
        message, 
        timestamp: new Date().toISOString() 
      });
    }
  };

  try {
    emitLog('info', `🔄 Starting update for container: ${containerId}`);
    
    // Get container info
    const container = docker.getContainer(containerId);
    const containerInfo = await container.inspect();
    
    const containerName = containerInfo.Name.replace('/', '');
    const imageName = containerInfo.Config.Image;

    emitLog('info', `📦 Container: ${containerName}`);
    emitLog('info', `📦 Current image: ${imageName}`);
    
    // Pull the latest image
    emitLog('info', `⬇️  Pulling latest image: ${imageName}`);
    
    await new Promise((resolve, reject) => {
      docker.pull(imageName, (err, stream) => {
        if (err) return reject(err);

        docker.modem.followProgress(stream, (err, output) => {
          if (err) return reject(err);
          resolve(output);
        }, (event) => {
          if (event.status) {
            const progress = event.progress || '';
            emitLog('progress', `   ${event.status} ${progress}`);
          }
        });
      });
    });

    emitLog('success', `✅ Image pulled successfully`);

    // Stop container
    emitLog('info', `⏹️  Stopping container...`);
    await container.stop({ t: 10 }).catch(err => {
      // Ignore if already stopped
      if (!err.message.includes('304') && !err.message.includes('not running')) {
        throw err;
      }
    });
    emitLog('success', `✅ Container stopped`);

    // Remove old container
    emitLog('info', `🗑️  Removing old container...`);
    await container.remove();
    emitLog('success', `✅ Container removed`);

    // Recreate container with same configuration
    emitLog('info', `🔄 Recreating container with same configuration...`);
    
    const newContainer = await docker.createContainer({
      name: containerName,
      Image: imageName,
      Env: containerInfo.Config.Env,
      Cmd: containerInfo.Config.Cmd,
      Entrypoint: containerInfo.Config.Entrypoint,
      WorkingDir: containerInfo.Config.WorkingDir,
      User: containerInfo.Config.User,
      ExposedPorts: containerInfo.Config.ExposedPorts,
      Labels: containerInfo.Config.Labels,
      Volumes: containerInfo.Config.Volumes,
      HostConfig: {
        ...containerInfo.HostConfig,
        // Ensure proper format for Binds
        Binds: containerInfo.HostConfig.Binds || [],
        PortBindings: containerInfo.HostConfig.PortBindings || {},
        RestartPolicy: containerInfo.HostConfig.RestartPolicy || { Name: 'unless-stopped' },
        NetworkMode: containerInfo.HostConfig.NetworkMode || 'bridge',
      }
    });

    emitLog('info', `▶️  Starting new container...`);
    await newContainer.start();
    emitLog('success', `✅ Container recreated and started successfully!`);
    emitLog('success', `🎉 Update completed for ${containerName}!`);

    // Emit completion event
    if (io) {
      io.emit('update-complete', { 
        clientId,
        containerId,
        containerName,
        success: true,
        timestamp: new Date().toISOString() 
      });
    }

  } catch (error) {
    emitLog('error', `❌ Error during update: ${error.message}`);
    console.error('[UPDATE-CONTAINER] Error:', error);
    
    // Emit error event
    if (io) {
      io.emit('update-complete', { 
        clientId,
        containerId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  }
}

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
