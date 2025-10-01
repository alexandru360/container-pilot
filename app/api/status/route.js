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

    if (containerNames.length === 0) {
      return NextResponse.json({ containers: [] });
    }

    // Get all containers
    const allContainers = await docker.listContainers({ all: true });
    
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
    console.error('Error getting container status:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
