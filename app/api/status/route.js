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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [STATUS] ========== NEW REQUEST ==========`);
  
  try {
    console.log(`[${timestamp}] [STATUS] Environment variables:`);
    console.log(`[${timestamp}] [STATUS]   DOCKER_IMAGES:`, process.env.DOCKER_IMAGES || 'NOT SET');
    console.log(`[${timestamp}] [STATUS]   DOCKER_HOST:`, process.env.DOCKER_HOST || 'NOT SET (using default)');
    console.log(`[${timestamp}] [STATUS]   NODE_ENV:`, process.env.NODE_ENV);
    
    const docker = getDockerClient();
    const dockerImages = process.env.DOCKER_IMAGES || '';
    const containerNames = dockerImages.split(',').map(name => name.trim()).filter(Boolean);

    console.log(`[${timestamp}] [STATUS] Parsed container names:`, JSON.stringify(containerNames));

    if (containerNames.length === 0) {
      console.log(`[${timestamp}] [STATUS] WARNING: No containers configured, returning empty list`);
      return NextResponse.json({ containers: [] });
    }

    // Get all containers
    console.log(`[${timestamp}] [STATUS] Calling docker.listContainers({ all: true })...`);
    const allContainers = await docker.listContainers({ all: true });
    console.log(`[${timestamp}] [STATUS] Found ${allContainers.length} total containers in Docker`);
    console.log(`[${timestamp}] [STATUS] Container names from Docker:`, allContainers.map(c => c.Names).flat());
    
    // Filter and map our configured containers
    const statusList = containerNames.map(name => {
      console.log(`[${timestamp}] [STATUS] Looking for container: "${name}"`);
      
      const containerInfo = allContainers.find(c => 
        c.Names.some(n => n === `/${name}` || n === name)
      );

      if (!containerInfo) {
        console.log(`[${timestamp}] [STATUS] Container "${name}" NOT FOUND in Docker`);
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

      console.log(`[${timestamp}] [STATUS] Container "${name}" FOUND:`, {
        id: containerInfo.Id,
        state: containerInfo.State,
        status: containerInfo.Status,
        image: containerInfo.Image
      });

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

    console.log(`[${timestamp}] [STATUS] SUCCESS: Returning status for ${statusList.length} containers`);

    return NextResponse.json({
      containers: statusList,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[${timestamp}] [STATUS] ========== ERROR ==========`);
    console.error(`[${timestamp}] [STATUS] Error name:`, error.name);
    console.error(`[${timestamp}] [STATUS] Error message:`, error.message);
    console.error(`[${timestamp}] [STATUS] Error code:`, error.code);
    console.error(`[${timestamp}] [STATUS] Error stack:`, error.stack);
    console.error(`[${timestamp}] [STATUS] DOCKER_HOST:`, process.env.DOCKER_HOST || 'NOT SET');
    console.error(`[${timestamp}] [STATUS] Default socket path:`, '/var/run/docker.sock');
    
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code,
        dockerHost: process.env.DOCKER_HOST || '/var/run/docker.sock'
      },
      { status: 500 }
    );
  } finally {
    console.log(`[${timestamp}] [STATUS] ========== REQUEST END ==========`);
  }
}

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
