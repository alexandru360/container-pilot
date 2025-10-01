import { NextResponse } from 'next/server';
import Docker from 'dockerode';

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
  console.log(`[${timestamp}] [CONTROL] ========== NEW REQUEST ==========`);
  
  try {
    console.log(`[${timestamp}] [CONTROL] Parsing request body...`);
    const { containerId, action } = await request.json();
    
    console.log(`[${timestamp}] [CONTROL] Container ID:`, containerId);
    console.log(`[${timestamp}] [CONTROL] Action:`, action);

    if (!containerId || !action) {
      console.error(`[${timestamp}] [CONTROL] ERROR: Missing required parameters`);
      return NextResponse.json(
        { error: 'Container ID and action are required' },
        { status: 400 }
      );
    }

    if (!['start', 'stop', 'restart'].includes(action)) {
      console.error(`[${timestamp}] [CONTROL] ERROR: Invalid action "${action}"`);
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, or restart' },
        { status: 400 }
      );
    }

    console.log(`[${timestamp}] [CONTROL] Initializing Docker client...`);
    const docker = getDockerClient();
    
    console.log(`[${timestamp}] [CONTROL] Getting container object...`);
    const container = docker.getContainer(containerId);

    console.log(`[${timestamp}] [CONTROL] Executing action: ${action}`);
    switch (action) {
      case 'start':
        await container.start();
        console.log(`[${timestamp}] [CONTROL] Container started successfully`);
        break;
      case 'stop':
        await container.stop();
        console.log(`[${timestamp}] [CONTROL] Container stopped successfully`);
        break;
      case 'restart':
        await container.restart();
        console.log(`[${timestamp}] [CONTROL] Container restarted successfully`);
        break;
    }

    console.log(`[${timestamp}] [CONTROL] SUCCESS: Action "${action}" completed for container ${containerId}`);

    return NextResponse.json({
      success: true,
      message: `Container ${action} successful`,
      containerId,
      action
    });
  } catch (error) {
    console.error(`[${timestamp}] [CONTROL] ========== ERROR ==========`);
    console.error(`[${timestamp}] [CONTROL] Error name:`, error.name);
    console.error(`[${timestamp}] [CONTROL] Error message:`, error.message);
    console.error(`[${timestamp}] [CONTROL] Error code:`, error.code);
    console.error(`[${timestamp}] [CONTROL] Error stack:`, error.stack);
    console.error(`[${timestamp}] [CONTROL] Full error:`, JSON.stringify(error, null, 2));
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    console.log(`[${timestamp}] [CONTROL] ========== REQUEST END ==========`);
  }
}

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
