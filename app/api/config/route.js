import { NextResponse } from 'next/server';

export async function GET() {
  // Force read from actual environment (not cached)
  const dockerImages = process.env.DOCKER_IMAGES || '';
  const dockerHost = process.env.DOCKER_HOST || '/var/run/docker.sock';
  const containers = dockerImages.split(',').map(name => name.trim()).filter(Boolean);
  
  return NextResponse.json({
    containers,
    count: containers.length,
    raw: dockerImages,
    dockerHost,
    timestamp: new Date().toISOString()
  });
}

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
