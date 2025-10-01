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
  try {
    const { containerId, action } = await request.json();

    if (!containerId || !action) {
      return NextResponse.json(
        { error: 'Container ID and action are required' },
        { status: 400 }
      );
    }

    if (!['start', 'stop', 'restart'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, or restart' },
        { status: 400 }
      );
    }

    const docker = getDockerClient();
    const container = docker.getContainer(containerId);

    switch (action) {
      case 'start':
        await container.start();
        break;
      case 'stop':
        await container.stop();
        break;
      case 'restart':
        await container.restart();
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Container ${action} successful`,
      containerId,
      action
    });
  } catch (error) {
    console.error('Error controlling container:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;
