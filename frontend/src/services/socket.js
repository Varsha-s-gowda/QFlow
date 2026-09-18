import { io } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket.IO Client] Disconnected');
    });
  }
  return socket;
};

export const subscribeToServiceQueue = (serviceId, callback) => {
  const s = getSocket();
  if (serviceId) {
    s.emit('join_service_room', serviceId);
  }
  s.on('queue_updated', callback);

  return () => {
    if (serviceId) {
      s.emit('leave_service_room', serviceId);
    }
    s.off('queue_updated', callback);
  };
};

export const subscribeToUserToken = (userId, callback) => {
  const s = getSocket();
  if (userId) {
    s.emit('join_user_room', userId);
  }
  s.on('token_status_changed', callback);

  return () => {
    s.off('token_status_changed', callback);
  };
};
