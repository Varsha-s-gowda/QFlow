const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for specific service queue tracking
    socket.on('join_service_room', (serviceId) => {
      socket.join(`service_${serviceId}`);
      console.log(`[Socket.IO] Client ${socket.id} joined room service_${serviceId}`);
    });

    // Leave room
    socket.on('leave_service_room', (serviceId) => {
      socket.leave(`service_${serviceId}`);
    });

    // Join user specific room
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const notifyQueueUpdate = (serviceId, payload) => {
  if (io) {
    // Broadcast to everyone in service room and overall queue room
    io.to(`service_${serviceId}`).emit('queue_updated', payload);
    io.emit('global_queue_updated', { serviceId, timestamp: new Date() });
  }
};

const notifyTokenUpdate = (userId, payload) => {
  if (io) {
    io.to(`user_${userId}`).emit('token_status_changed', payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  notifyQueueUpdate,
  notifyTokenUpdate
};
