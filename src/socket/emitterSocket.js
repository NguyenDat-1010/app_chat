

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

const emitgroupCreated = (io, memberIds, conversation) => {
    memberIds.forEach((id) => {
        io.to(`user:${id}`).emit('group:created', conversation);
    });
};

const emitmemberAdd = (io, newmemberIds, conversationId, updatedConversation) => {
    io.to(`conversation:${conversationId}`).emit('group:member_add', {
        conversationId,
        newmemberIds,
        conversation: updatedConversation
    });
    newmemberIds.forEach((id) => {
        io.to(`user:${id}`).emit('group:created', updatedConversation);
    });

};

const emitmemberRemoved = (io, conversationId, removedUserId, updatedConversation) => {
    // Báo riêng cho người bị xóa
    io.to(`user:${removedUserId}`).emit('group:left', { conversationId });
    // Rút người đó ra khỏi room socket của conversation
    io.to(`user:${removedUserId}`).socketsLeave(`conversation:${conversationId}`);
    // Báo cho những người còn lại trong nhóm
    io.to(`conversation:${conversationId}`).emit('group:member_removed', {
        conversationId,
        removedUserId,
        conversation: updatedConversation
    });
};
const emitgroupUpdated = (io, conversationId, updatedConversation) => {
    io.to(`conversation:${conversationId}`).emit('group:updated', updatedConversation);
};

module.exports = {
    emitnewMessage,
    joinusertoConversation,
    emitmessageRead,
    emitgroupCreated,
    emitmemberAdd,
    emitmemberRemoved,
    emitgroupUpdated
}