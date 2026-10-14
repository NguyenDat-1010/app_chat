const emitnewMessage = (io, message) => {
    io.to(`conversation:${message.conversation}`).emit('message:new', message);
};

const joinusertoConversation = (io, userIds, conversationId) => {
    userIds.forEach((id) => {
        io.to(`user:${id}`).socketsJoin(`conversation:${conversationId}`);

    });
};

module.exports = {
    emitnewMessage,
    joinusertoConversation
}