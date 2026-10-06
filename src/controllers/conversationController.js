const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { findOne } = require('../models/User');
const mongoose = require('mongoose');



const createConversation = async (req, res, next) => {
    try {
        const { userId } = req.body;
        //kiem tra xem id co hop le hay khong
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Id khong hop le'
            });
        }

        //kiem tra user muon chat cung

        if (!userId) {
            return res.status(400).json({
                message: 'Thieu userId'
            });
        }
        //lay id cua nguoi hien tai
        const currentUserId = req.user.userId;
        //kiem tra xem co bị trung id với minh khong
        if (currentUserId.toString() === userId.toString()) {
            return res.status(400).json({
                message: 'Khong the tao conversation voi chinh minh'
            });
        }
        //kiem tra xem conversation da ton tai chua
        const existingConversation = await Conversation.findOne({
            participants: {
                $all: [currentUserId, userId]
            }
        });
        if (existingConversation) {
            return res.status(400).json({
                message: 'Conversation da ton tai',
                conversation: existingConversation
            });
        }
        //neu chua ton tai thi tao moi  conservation

        const conversation = await Conversation.create({
            participants: [
                currentUserId,
                userId
            ]
        });
        res.status(200).json({
            message: 'tao conservation thanh cong',
            conversation
        });

    } catch (error) {
        next(error);
    }
};

const getMyConversation = async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;
        const conversations = await Conversation.find({
            participants: currentUserId
        })
            .populate('participants', 'username email avatar status')
            .sort({ updatedAt: -1 });
        //lay conversation voi lastmessage
        const conversationswithlastMessage = await Promise.all(
            conversations.map(async (conversation) => {
                const lastMessage = await Message.findOne({
                    conversation: conversation._id
                })
                    .sort({ createdAt: -1 })
                    .populate('sender', ' username avatar');
                return {
                    ...conversation.toObject(),
                    lastMessage
                };
            })
        );
        res.status(200).json({
            message: 'Lay danh sach conversation voi last message thanh cong',
            data: conversationswithlastMessage
        });
    } catch (error) {
        next(error);
    }
}



module.exports = {
    createConversation,
    getMyConversation
};