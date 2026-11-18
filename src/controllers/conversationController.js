const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { findOne } = require('../models/User');
const mongoose = require('mongoose');

//import emitterSocket from Socket
const { joinusertoConversation } = require('../socket/emitterSocket.js');



const createConversation = async (req, res, next) => {
    try {
        const { userId } = req.body;
        //kiem tra user muon chat cung
        if (!userId) {
            return res.status(400).json({
                message: 'Thieu userId'
            });
        }
        //kiem tra xem id co hop le hay khong
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Id khong hop le'
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
        //join vao conversation ngay sau khi tao
        joinusertoConversation(req.app.get('io'), [currentUserId, userId], conversation._id);
        res.status(200).json({
            message: 'tao conservation thanh cong',
            conversation
        });

    } catch (error) {
        next(error);
    }
};
/*
const getMyConversation = async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;

        const conversations = await Conversation.find({
            participants: currentUserId
        })
            .populate('participants', 'username email avatar status')
            .sort({ updatedAt: -1 });

        const result = await Promise.all(
            conversations.map(async (c) => {
                const [unreadCount, lastMessage] = await Promise.all([
                    Message.countDocuments({
                        conversation: c._id,
                        readBy: { $ne: currentUserId }
                    }),
                    Message.findOne({ conversation: c._id })
                        .sort({ createdAt: -1 })
                        .populate('sender', 'username avatar')
                ]);

                return { ...c.toObject(), unreadCount, lastMessage };
            })
        );

        res.status(200).json({
            message: 'Lay danh sach conversation thanh cong',
            data: result
        });
    } catch (error) {
        next(error);
    }
};
*/

const getMyConversation = async (req, res, next) => {
    try {
        const currentUserId = new mongoose.Types.ObjectId(req.user.userId);
        const conversations = await Conversation.aggregate([
            // 1. Chỉ lấy conversation của user hiện tại
            {
                $match: {
                    participants: currentUserId
                }
            },
            // Sắp xếp theo conversation mới cập nhật trước
            {
                $sort: { updatedAt: -1 }
            },
            // 2. Populate participants (thay cho .populate('participants', 'username email avatar status'))
            {
                $lookup: {
                    from: 'users',
                    localField: 'participants',
                    foreignField: '_id',
                    as: 'participants',
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                email: 1,
                                avatar: 1,
                                status: 1
                            }
                        }
                    ]
                }
            },
            // 3. Lấy tin nhắn cuối cùng (lastMessage) kèm thông tin sender
            {
                $lookup: {
                    from: 'messages',
                    let: { conversationId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$conversation', '$$conversationId'] }
                            }
                        },
                        { $sort: { createdAt: -1 } },
                        { $limit: 1 },
                        // Join để lấy thông tin sender của tin nhắn cuối
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'sender',
                                foreignField: '_id',
                                as: 'sender',
                                pipeline: [
                                    {
                                        $project: {
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        // unwind biến sender từ mảng [sender] thành object sender
                        {
                            $unwind: {
                                path: '$sender',
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ],
                    as: 'lastMessage'
                }
            },
            // 4. Đếm số tin nhắn chưa đọc (unreadCount)
            {
                $lookup: {
                    from: 'messages',
                    let: { conversationId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$conversation', '$$conversationId'] },
                                        { $not: { $in: [currentUserId, '$readBy'] } }
                                    ]
                                }
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'unreadInfo'
                }
            },
            // 5. Chuẩn hóa output trả về frontend (lastMessage thành object, unreadCount thành number)
            {
                $addFields: {
                    lastMessage: { $arrayElemAt: ['$lastMessage', 0] },
                    unreadCount: {
                        $ifNull: [{ $arrayElemAt: ['$unreadInfo.count', 0] }, 0]
                    }
                }
            },
            // Bỏ field phụ unreadInfo
            {
                $project: {
                    unreadInfo: 0
                }
            }
        ]);
        res.status(200).json({
            message: 'Lay danh sach conversation thanh cong',
            data: conversations
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createConversation,
    getMyConversation
};