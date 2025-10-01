import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    dockerImages: process.env.DOCKER_IMAGES || 'none configured',
    timestamp: new Date().toISOString()
  });
}
