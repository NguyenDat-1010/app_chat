const Conversation = require('../models/Conversation');
const { findOne } = require('../models/User');


const createConversation = async (req, res) => {
    try {
        const { userId } = req.body;
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

    } catch (err) {
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
};

const getMyConversation = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const conversations = await Conversation.find({
            participants: currentUserId
        })
            .populate('participants', 'username email avatar status')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            message: 'Lay danh sach conversation thanh cong',
            data: conversations
        });
    } catch (err) {
        console.error('Get conversation error:', err);
        res.status(500).json({
            message: 'Server error',
            error: err.message
        });
    }
}



module.exports = {
    createConversation,
    getMyConversation
};