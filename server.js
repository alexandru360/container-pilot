const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initSocketIO } = require('./lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Don't cache environment variables - let them be read fresh on each API call
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [SERVER] ${req.method} ${req.url}`);
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
      
      console.log(`[${timestamp}] [SERVER] ${req.method} ${req.url} -> ${res.statusCode}`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] [SERVER] ERROR handling ${req.method} ${req.url}:`, err);
      console.error('[SERVER] Error stack:', err.stack);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  initSocketIO(httpServer);

  httpServer
    .once('error', (err) => {
      console.error('[SERVER] Fatal error:', err);
      console.error('[SERVER] Error stack:', err.stack);
      process.exit(1);
    })
    .listen(port, () => {
      console.log('='.repeat(60));
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`📦 Configured containers: ${process.env.DOCKER_IMAGES || 'none'}`);
      console.log(`🐋 Docker host: ${process.env.DOCKER_HOST || '/var/run/docker.sock (default)'}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📅 Started at: ${new Date().toISOString()}`);
      console.log('='.repeat(60));
    });
});
