const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { findOne } = require('../models/User');
const mongoose = require('mongoose');


//import emitterSocket tu Socket
const { joinusertoConversation, emitgroupCreated, emitmemberAdd, emitmemberRemoved, emitgroupUpdated } = require('../socket/emitterSocket.js');



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

const creatGroup = async (req, res, next) => {
    try {
        const { name, participants } = req.body;
        const currentUserId = req.user.userId;
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Khong duoc de trong ten nhom'
            });
        }
        if (!participants || !Array.isArray(participants) || participants.length < 2) {
            return res.status(400).json({
                message: 'Nhom can it nhat 3 nguoi'
            });
        }
        if (!participants.every((id) => mongoose.isValidObjectId(id))) {
            return res.status(400).json({
                message: 'danh sach chua id khong hop le'
            });
        }
        //loai bo danh sach trung lap
        const memberIds = Array.from(
            new Set([currentUserId.toString(), ...participants.map(id => id.toString())])
        );
        //tao nhom
        const groupConversation = await Conversation.create({
            name: name.trim(),
            isGroup: true,
            admin: currentUserId,
            participants: memberIds
        });
        await groupConversation.populate([
            { path: 'participants', select: 'username email avatar status' },
            { path: 'admin', select: 'username email avatar' }
        ]);
        //Đưa tat ca vao socket cua nhom 
        joinusertoConversation(req.app.get('io'), memberIds, groupConversation._id);
        emitgroupCreated(req.app.get('io'), memberIds, groupConversation);
        res.status(200).json({
            message: 'Tao nhom thanh cong',
            conversation: groupConversation
        });
    } catch (error) {
        next(error);
    }
};

const addmembertoGroup = async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;
        const { memberIds } = req.body;//mang cac user muon them vao nhom chat
        const { conversationId } = req.params;
        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({
                message: 'Danh sach khong hop le'
            });
        }
        const uniquememberIds = Array.from(new Set(memberIds.map(id => id.toString())));
        const isValid = uniquememberIds.every(id => mongoose.Types.ObjectId.isValid(id));
        if (!isValid) {
            return res.status(400).json({ message: 'Có userId không hợp lệ' });
        }
        const conversation = await Conversation.findOne({
            _id: conversationId,
            isGroup: true
        });
        if (!conversation) {
            return res.status(404).json({
                message: 'khong tim thay nhom'
            });
        }
        const isMember = conversation.participants.some(
            p => p.toString() === currentUserId.toString()
        );
        if (!isMember) {
            return res.status(403).json({
                message: 'Ban khong co quyen them thanh vien vao nhom nay'
            });
        }
        const newMember = uniquememberIds.filter(
            id => !conversation.participants.some(p => p.toString() === id.toString())
        );
        if (newMember.length === 0) {
            return res.status(400).json({
                message: 'tat ca nguoi dung da o trong nhom'
            });
        }
        conversation.participants.push(...newMember);
        await conversation.save();
        await conversation.populate([
            { path: 'participants', select: 'username email avatar status' },
            { path: 'admin', select: 'username email avatar' }
        ]);
        joinusertoConversation(req.app.get('io'), newMember, conversation._id);
        emitmemberAdd(req.app.get('io'), newMember, conversation._id, conversation);
        res.status(200).json({
            message: 'Them thanh cong',
            conversation
        });
    } catch (error) {
        next(error);
    }
};

const removememberfromGroup = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { userIdToRemove } = req.body; // User bị xóa hoặc tự rời
        const currentUserId = req.user.userId;
        const conversation = await Conversation.findOne({
            _id: conversationId,
            isGroup: true
        });
        if (!conversation) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }
        const isAdmin = conversation.admin.toString() === currentUserId.toString();
        const isSelfLeaving = currentUserId.toString() === userIdToRemove.toString();
        // Chỉ Admin mới được kick người khác; bản thân thì luôn có quyền tự rời
        if (!isAdmin && !isSelfLeaving) {
            return res.status(403).json({ message: 'Chỉ Admin mới có quyền xóa thành viên khác' });
        }
        // Loại bỏ user khỏi participants
        conversation.participants = conversation.participants.filter(
            p => p.toString() !== userIdToRemove.toString()
        );
        // Nếu admin tự rời nhóm: chuyển admin cho thành viên đầu tiên còn lại (nếu còn người)
        if (isAdmin && isSelfLeaving && conversation.participants.length > 0) {
            conversation.admin = conversation.participants[0];
        }
        await conversation.save();
        emitmemberRemoved(req.app.get('io'), conversation._id, userIdToRemove, conversation);
        res.status(200).json({
            message: isSelfLeaving ? 'Đã rời nhóm thành công' : 'Đã xóa thành viên khỏi nhóm',
            conversation
        });
    } catch (error) {
        next(error);
    }
};

const updateGroup = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { name, avatar } = req.body;
        const currentUserId = req.user.userId;
        const conversation = await Conversation.findOne({
            _id: conversationId,
            isGroup: true
        });
        if (!conversation) {
            return res.status(404).json({ message: 'Không tìm thấy nhóm' });
        }
        // Kiểm tra quyền: phải là thành viên nhóm
        const isMember = conversation.participants.some(
            p => p.toString() === currentUserId.toString()
        );
        if (!isMember) {
            return res.status(403).json({ message: 'Bạn không phải thành viên nhóm' });
        }
        if (name) conversation.name = name.trim();
        if (avatar) conversation.avatar = avatar;
        await conversation.save();
        emitgroupUpdated(req.app.get('io'), conversation._id, conversation);
        res.status(200).json({
            message: 'Cập nhật nhóm thành công',
            conversation
        });
    } catch (error) {
        next(error);
    }
};



module.exports = {
    createConversation,
    getMyConversation,
    creatGroup,
    addmembertoGroup,
    removememberfromGroup,
    updateGroup
};