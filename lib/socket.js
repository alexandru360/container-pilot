import { Server } from 'socket.io';

let io = null;

export function initSocketIO(httpServer) {
  if (!io) {
    io = new Server(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('✅ Socket.IO initialized');
  }
  return io;
}

export function getSocketIO() {
  return io;
}
