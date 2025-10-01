import { NextResponse } from 'next/server';
import Docker from 'dockerode';
import { getSocketIO } from '@/lib/socket';

// Initialize Docker client with configurable host
function getDockerClient() {
  const dockerHost = process.env.DOCKER_HOST;
  
  if (dockerHost) {
    // Use specified Docker host (e.g., http://192.168.1.100:2375 or unix:///var/run/docker.sock)
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
  
  // Default to socket path
  return new Docker({ socketPath: '/var/run/docker.sock' });
}

export async function POST() {
  const dockerImages = process.env.DOCKER_IMAGES || '';
  const containerNames = dockerImages.split(',').map(name => name.trim()).filter(Boolean);

  if (containerNames.length === 0) {
    return NextResponse.json(
      { error: 'No containers configured. Set DOCKER_IMAGES environment variable.' },
      { status: 400 }
    );
  }

  // Start update process in background
  updateContainers(containerNames);

  return NextResponse.json({ 
    message: 'Update started',
    containers: containerNames
  });
}

async function updateContainers(containerNames) {
  const io = getSocketIO();
  const clientId = Date.now().toString();
  const docker = getDockerClient();
  
  const emitLog = (level, message) => {
    console.log(`[${level.toUpperCase()}] ${message}`);
    if (io) {
      io.emit('update-log', { 
        clientId, 
        level, 
        message, 
        timestamp: new Date().toISOString() 
      });
    }
  };

  for (const containerName of containerNames) {
    try {
      emitLog('info', `\n🔄 Starting update for: ${containerName}`);
      
      // Find the container
      const containers = await docker.listContainers({ all: true });
      const containerInfo = containers.find(c => 
        c.Names.some(name => name === `/${containerName}` || name === containerName)
      );

      if (!containerInfo) {
        emitLog('warning', `⚠️  Container '${containerName}' not found, skipping...`);
        continue;
      }

      const container = docker.getContainer(containerInfo.Id);
      const imageName = containerInfo.Image;

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
      await container.stop().catch(err => {
        if (!err.message.includes('304')) throw err;
      });
      emitLog('success', `✅ Container stopped`);

      // Remove old container
      emitLog('info', `🗑️  Removing old container...`);
      await container.remove();
      emitLog('success', `✅ Container removed`);

      // Recreate container
      emitLog('info', `🔄 Recreating container...`);
      
      const newContainer = await docker.createContainer({
        name: containerName,
        Image: imageName,
        ...containerInfo.Config,
        HostConfig: containerInfo.HostConfig
      });

      await newContainer.start();
      emitLog('success', `✅ Container recreated and started!\n`);

    } catch (error) {
      emitLog('error', `❌ Error updating ${containerName}: ${error.message}`);
      console.error(`Error updating ${containerName}:`, error);
    }
  }

  emitLog('info', `\n🎉 Update process completed for all containers!`);
}

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
