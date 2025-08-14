// socket.js
import dotenv from 'dotenv'
dotenv.config()
export const initSocket = async (server) => {
  const { Server } = await import('socket.io');
  const io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_IO_MAIN,
      methods: [ 'GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🔍Socket Client connected:', socket.id);
    socket.emit('server-log', { msg: 'Welcome! Server log streaming started.' });
  });

  return io;
};