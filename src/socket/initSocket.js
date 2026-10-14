const { Server } = require('socket.io');
const authSocket = require('./authSocket.js');

const Conversation = require('../models/Conversation.js');



/**
 * Initialize Socket.io server with authentication middleware.
 * @param {http.Server} httpServer - The HTTP server instance to attach Socket.io.
 * @returns {Server} The configured Socket.io instance.
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  // Apply authentication middleware before allowing connections
  io.use(authSocket);

  io.on('connection', async (socket) => {
    const userId = socket.user?.userId;
    console.log('Socket connected:', socket.id, 'user:', userId);

    //join vào hộp thư riêng
    socket.join(`user:${userId}`);

    //join vào tất cả conversation cua minh
    const conversations = await Conversation.find({
      participants: userId
    }).select('_id');
    conversations.forEach((c) => {
      socket.join(`conversation:${c._id}`);
    });
    console.log('Room:', socket.rooms);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
}

// Export the function directly for simple require usage
module.exports = initSocket;