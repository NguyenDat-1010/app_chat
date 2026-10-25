const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const mongoose = require('mongoose');


//import emitterSocket from Socket 
const { emitnewMessage, emitmessageRead } = require('../socket/emitterSocket.js');

const createMessage = async (req, res, next) => {
    try {
        const { conversationId, content } = req.body;
        //kiem tra du lieu
        if (!conversationId || !content) {
            return res.status(400).json({
                message: 'thieu conversation hoac content'
            });
        }
        // kiem tra id co hop le hay khong
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                message: 'conversation Id khong hop le'
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
            conversation: conversationId,
            content,
            readBy: [currentUserId]
        });
        //Cap nhat thoi gian update cua conversation
        await Conversation.findByIdAndUpdate(conversationId,
            {
                updatedAt: new Date()
            }
        );
        // goi emitnewMessage
        //them sender uername va avatar vao message
        await message.populate('sender', 'username avatar');
        emitnewMessage(req.app.get('io'), message);
        //tra du lieu
        res.status(200).json({
            message: 'Gui tin nhan thanh cong',
            data: message
        });
    } catch (error) {
        next(error);
    }
};

const getMessage = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        //kiem tra id xem co hop le hay khong
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                message: 'conversation Id khong hop le'
            });
        }
        //lay page va limit từ query
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        //gioi han limit de tranh client yeu cau qua nhieu du lieu
        const finalLimit = Math.min(limit, 100);
        //tinh so message can bo qua
        const skip = (page - 1) * finalLimit;
        //Thong tin user dang dang nhap
        const currentUserId = req.user.userId;
        //tim conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: 'khong tim thay conversation'
            });
        }
        //kiem tra xem user co thuoc conversation khong
        const isParticipant = conversation.participants.some(
            participant =>
                participant.toString() === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({
                message: 'Ban khong thuoc conversation nay'
            });
        }
        //dem tong so message
        const totalMessage = await Message.countDocuments({
            conversation: conversationId
        });
        //lay message theo pagnigation
        const message = await Message.find({
            conversation: conversationId
        })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(finalLimit);
        res.status(200).json({
            message: 'LAy message thanh cong',
            data: message,
            pagnigation: {
                page,
                limit: finalLimit,
                totalMessage,
                totalPage: Math.ceil(totalMessage / finalLimit)
            }
        });
    } catch (error) {
        next(error);
    }
};
const markasRead = async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;
        const { conversationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                message: 'Conversation ID khong hop le'
            });
        }
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                message: 'khong tim thay conversation'
            });
        }
        //kiem tra xem co thuoc converasation hay không
        const isMember = conversation.participants.some(
            (p) => p.toString() === currentUserId
        );
        if (!isMember) {
            return res.status(403).json({
                message: 'Ban khong thuoc conversation nay'
            });
        }
        const result = await Message.updateMany(
            { conversation: conversationId, readBy: { $ne: currentUserId } },
            { $addToSet: { readBy: currentUserId } }
        );
        // Chỉ báo realtime khi thật sự có tin được đánh dấu
        if (result.modifiedCount > 0) {
            emitmessageRead(req.app.get('io'), conversationId, currentUserId);
        }
        res.json({ updated: result.modifiedCount });
    } catch (error) {
        next(error);
    }

}

module.exports = {
    createMessage,
    getMessage,
    markasRead
};