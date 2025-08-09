// socket.js
export const initSocket = (server) => {
  const { Server } = await import('socket.io');
  const io = new Server(server);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('server-log', { msg: 'Welcome! Server log streaming started.' });
  });

  return io;
};