const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const createMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        //kiem tra du lieu
        if (!conversationId || !content) {
            return res.status(400).json({
                message: 'thieu conversation hoac content'
            });
        }
        //thong tin user dang dang nhap
        const currentUserId = req.user.userId;
        //tim conversation

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: 'Conversation khong ton tai'
            });
        }
        //Kiem tra xem user có thuoc conversation khong
        const isParticipant = conversation.participants.some(
            participant =>
                participant.toString() === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                message: 'Ban khong thuoc conversation nay'
            });
        }
        //tao message
        const message = await Message.create({
            sender: currentUserId,
            conversation: conversation,
            content
        });
        //Cap nhat thoi gian update cua conversation
        await Conversation.findByIdAndUpdate(conversationId,
            {
                updatedAt: new Date()
            }
        );
        res.status(200).json({
            message: 'Gui tin nhan thanh cong',
            data: message
        });
    } catch (error) {
        console.error('Create message error', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

const getMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user.userId;
        //tim conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: 'khong tim thay conversation'
            });
        }
        //kiem tra xem user co thuoc conversarion khong
        const isParticipant = conversation.participants.some(
            participant =>
                participant.toString() === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                message: 'Ban khong thuoc conversation nay'
            });
        }
        //lay message
        const message = await Message.find({
            conversation: conversationId
        }).sort({ createdAt: 1 });
        res.status(200).json({
            message: 'LAy message thanh cong',
            data: message
        });

    } catch (error) {
        console.error('Get message error', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    createMessage,
    getMessage
};