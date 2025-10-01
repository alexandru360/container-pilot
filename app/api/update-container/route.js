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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [UPDATE-CONTAINER] ========== NEW REQUEST ==========`);
  
  try {
    console.log(`[${timestamp}] [UPDATE-CONTAINER] Parsing request body...`);
    const body = await request.json();
    const { containerId } = body;

    console.log(`[${timestamp}] [UPDATE-CONTAINER] Request body:`, JSON.stringify(body));
    console.log(`[${timestamp}] [UPDATE-CONTAINER] Container ID:`, containerId);

    if (!containerId) {
      console.error(`[${timestamp}] [UPDATE-CONTAINER] ERROR: No container ID provided`);
      return NextResponse.json(
        { error: 'containerId is required' },
        { status: 400 }
      );
    }

    console.log(`[${timestamp}] [UPDATE-CONTAINER] Initializing Docker client...`);
    const docker = getDockerClient();
    const io = getSocketIO();
    const clientId = Date.now().toString();

    console.log(`[${timestamp}] [UPDATE-CONTAINER] Client ID: ${clientId}`);
    console.log(`[${timestamp}] [UPDATE-CONTAINER] Socket.IO initialized:`, !!io);
    console.log(`[${timestamp}] [UPDATE-CONTAINER] Starting background update process...`);

    // Start update in background
    updateContainer(docker, io, clientId, containerId);

    console.log(`[${timestamp}] [UPDATE-CONTAINER] SUCCESS: Update process started`);

    return NextResponse.json({ 
      message: 'Update started',
      containerId,
      clientId
    });

  } catch (error) {
    console.error(`[${timestamp}] [UPDATE-CONTAINER] ========== ERROR ==========`);
    console.error(`[${timestamp}] [UPDATE-CONTAINER] Error name:`, error.name);
    console.error(`[${timestamp}] [UPDATE-CONTAINER] Error message:`, error.message);
    console.error(`[${timestamp}] [UPDATE-CONTAINER] Error stack:`, error.stack);
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    console.log(`[${timestamp}] [UPDATE-CONTAINER] ========== REQUEST END ==========`);
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
