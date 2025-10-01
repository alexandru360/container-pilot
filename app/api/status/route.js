import { NextResponse } from 'next/server';
import Docker from 'dockerode';

// Initialize Docker client
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

export async function GET() {
  try {
    const docker = getDockerClient();
    const dockerImages = process.env.DOCKER_IMAGES || '';
    const containerNames = dockerImages.split(',').map(name => name.trim()).filter(Boolean);

    console.log('[STATUS] DOCKER_IMAGES:', dockerImages);
    console.log('[STATUS] Container names:', containerNames);
    console.log('[STATUS] DOCKER_HOST:', process.env.DOCKER_HOST);

    if (containerNames.length === 0) {
      console.log('[STATUS] No containers configured');
      return NextResponse.json({ containers: [] });
    }

    // Get all containers
    console.log('[STATUS] Attempting to list Docker containers...');
    const allContainers = await docker.listContainers({ all: true });
    console.log('[STATUS] Found', allContainers.length, 'containers');
    
    // Filter and map our configured containers
    const statusList = containerNames.map(name => {
      const containerInfo = allContainers.find(c => 
        c.Names.some(n => n === `/${name}` || n === name)
      );

      if (!containerInfo) {
        return {
          name,
          status: 'not-found',
          state: 'unknown',
          id: null,
          image: null,
          created: null,
          ports: []
        };
      }

      return {
        name,
        status: containerInfo.State,
        state: containerInfo.Status,
        id: containerInfo.Id,
        image: containerInfo.Image,
        created: containerInfo.Created,
        ports: containerInfo.Ports || []
      };
    });

    return NextResponse.json({
      containers: statusList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[STATUS] Error getting container status:', error);
    console.error('[STATUS] Error stack:', error.stack);
    console.error('[STATUS] DOCKER_HOST:', process.env.DOCKER_HOST);
    console.error('[STATUS] Socket path check:', '/var/run/docker.sock');
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code,
        dockerHost: process.env.DOCKER_HOST || '/var/run/docker.sock'
      },
      { status: 500 }
    );
  }
}

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
