/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Ensure these packages are included in the standalone build
  experimental: {
    serverComponentsExternalPackages: ['dockerode', 'socket.io', 'socket.io-client']
  }
}

module.exports = nextConfig
