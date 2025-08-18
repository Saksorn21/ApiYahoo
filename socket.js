// socket.js
import dotenv from 'dotenv'
import chalk from 'chalk'
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
    console.log(chalk.rgb(37, 194, 160).bold('[Socket.io]') + ' 🔍Socket Client connected:', socket.id)
    
    socket.emit('server-log', { message: 'Welcome! Server log streaming started.' });
  });

  return io;
};