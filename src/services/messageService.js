const mongoose = require('mongoose');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const AppError = require('../utils/appError');
const { emitnewMessage, emitmessageRead } = require('../socket/emitterSocket');
const { uploadFiles, deleteFiles } = require('./storage');
const { checkFile } = require('../utils/fileValidation');

const verifyMember = async (conversationId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new AppError('Conversation ID khong hop le', 400);
    }

    const conversation = await Conversation.findById(conversationId).select('participants');
    if (!conversation) {
        throw new AppError('Conversation khong ton tai', 404);
    }

    const isParticipant = conversation.participants.some(
        (participant) => participant.toString() === userId.toString()
    );
    if (!isParticipant) {
        throw new AppError('Ban khong thuoc conversation nay', 403);
    }

    return conversation;
};

const createMessage = async ({ userId, conversationId, content = '', files = [], io }) => {
    const trimmedContent = content.trim();
    if (!conversationId || (!trimmedContent && files.length === 0)) {
        throw new AppError('thieu conversation hoac noi dung file', 400);
    }

    await verifyMember(conversationId, userId);

    let attachments = [];
    try {
        if (files.length > 0) {
            const items = await Promise.all(
                files.map(async (file) => {
                    const { isImage } = await checkFile(file);
                    return { file, isImage };
                })
            );
            attachments = await uploadFiles(items);
        }

        let type = 'text';
        if (attachments.length > 0) {
            type = attachments.every((a) => a.resourceType === 'image') ? 'image' : 'file';
        }

        const message = await Message.create({
            sender: userId,
            conversation: conversationId,
            content: trimmedContent,
            type,
            attachments,
            readBy: [userId]
        });

        await Conversation.findByIdAndUpdate(conversationId, {
            updatedAt: new Date()
        });

        await message.populate('sender', 'username avatar');
        if (io) {
            emitnewMessage(io, message);
        }

        return message;
    } catch (error) {
        if (attachments.length > 0) {
            await deleteFiles(attachments);
        }
        throw error;
    }
};

const getMessages = async ({ userId, conversationId, limit, before }) => {
    await verifyMember(conversationId, userId);

    const parsedLimit = parseInt(limit, 10) || 20;
    const finalLimit = Math.min(Math.max(parsedLimit, 1), 100);

    const query = { conversation: conversationId };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(finalLimit + 1)
        .populate('sender', 'username avatar');

    const hasMore = messages.length > finalLimit;
    if (hasMore) {
        messages.pop();
    }

    const chronologicalMessages = messages.reverse();

    return {
        data: chronologicalMessages,
        pagination: {
            hasMore,
            nextCursor: chronologicalMessages.length > 0 ? chronologicalMessages[0].createdAt : null
        }
    };
};


const markAsRead = async ({ userId, conversationId, io }) => {
    await verifyMember(conversationId, userId);

    const result = await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
    );

    if (result.modifiedCount > 0 && io) {
        emitmessageRead(io, conversationId, userId);
    }

    return { updated: result.modifiedCount };
};

module.exports = {
    createMessage,
    getMessages,
    markAsRead
};
