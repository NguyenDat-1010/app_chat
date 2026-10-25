const emitnewMessage = (io, message) => {
    io.to(`conversation:${message.conversation}`).emit('message:new', message);
};

const joinusertoConversation = (io, userIds, conversationId) => {
    userIds.forEach((id) => {
        io.to(`user:${id}`).socketsJoin(`conversation:${conversationId}`);

    });
};
const emitmessageRead = (io, conversationId, userId) => {
    io.to(`conversation:${conversationId}`).emit('message:read', {
        conversationId,
        userId,
        readAt: new Date()
    });
};

module.exports = {
    emitnewMessage,
    joinusertoConversation,
    emitmessageRead

}