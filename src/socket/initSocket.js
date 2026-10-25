const { Server } = require('socket.io');
const authSocket = require('./authSocket.js');

const Conversation = require('../models/Conversation.js');
const User = require('../models/User.js');

const { onlineUsers, broadcastStatus } = require('./onlineUsers.js');



/**
 * Initialize Socket.io server with authentication middleware.
 * @param {http.Server} httpServer - The HTTP server instance to attach Socket.io.
 * @returns {Server} The configured Socket.io instance.
 */


function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  //kiem tra xác thực
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
    //neu user chua co trong danh sach online thi Luu vao danh sach online
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    //neu da ton tai trong danh sach online
    onlineUsers.get(userId).add(socket.id);
    if (onlineUsers.get(userId).size === 1) {
      //cap nhat status
      await User.findByIdAndUpdate(userId, { status: 'online' });
      await broadcastStatus(io, userId, 'online', null);
    }
    //client hoi ai đang onl
    socket.on('user:online', (ack) => {
      ack?.([...onlineUsers.keys()]);
    });
    console.log('Online users:', [...onlineUsers.keys()]);
    console.log('Room:', socket.rooms);

    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      //xoa socket id khoi danh sach online cua 1 user
      const userSockets = onlineUsers.get(userId);
      userSockets?.delete(socket.id);
      if (!userSockets || userSockets.size === 0) {
        onlineUsers.delete(userId);
        console.log('User Offline:', userId);
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen });
        await broadcastStatus(io, userId, 'offline', lastSeen);
      }

    });
  });

  return io;
}

// Export the function directly for simple require usage
module.exports = initSocket;