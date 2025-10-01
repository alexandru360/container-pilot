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
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  initSocketIO(httpServer);

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`📦 Configured containers: ${process.env.DOCKER_IMAGES || 'none'}`);
      console.log(`🐋 Docker host: ${process.env.DOCKER_HOST || '/var/run/docker.sock (default)'}`);
    });
});
