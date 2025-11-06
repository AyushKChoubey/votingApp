const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

module.exports = {
  init(httpServer) {
    if (io) return io;

    io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(u => u.trim()) : [])
          : ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true
      }
    });

    // Middleware to attach user id if token provided in handshake
    io.use((socket, next) => {
      try {
        const token = socket.handshake?.auth?.token;
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.userId = decoded.id;
        }
      } catch (err) {
        // Don't fail the connection on token issues; allow anonymous sockets
        console.warn('Socket auth failed:', err.message);
      }
      next();
    });

    io.on('connection', (socket) => {
      try {
        // lightweight connection logging
        console.log('Socket connected:', socket.id, socket.userId ? `(user:${socket.userId})` : '(anonymous)');

        // If authenticated, put socket into user-specific room for direct notifications
        if (socket.userId) {
          socket.join(`user:${socket.userId}`);
        }

        // join a booth room
        socket.on('joinBooth', (boothId) => {
          if (boothId) {
            socket.join(`booth:${boothId}`);
          }
        });

        socket.on('leaveBooth', (boothId) => {
          if (boothId) socket.leave(`booth:${boothId}`);
        });

        socket.on('disconnect', (reason) => {
          // silent disconnect log
        });
      } catch (err) {
        console.error('Socket error during connection handling', err);
      }
    });

    return io;
  },

  getIo() {
    return io;
  }
};
