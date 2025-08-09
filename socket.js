// socket.js
export const initSocket = async (server) => {
  const { Server } = await import('socket.io');
  const io = new Server(server, {
    cors: {
      origin: 'https://3403af8d-1ebd-4892-becc-e20b2c2041a9-00-fstkim4pgg77.riker.replit.dev',
      methods: [ 'GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('server-log', { msg: 'Welcome! Server log streaming started.' });
  });

  return io;
};