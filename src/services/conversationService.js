const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const AppError = require('../utils/appError');
const {
    joinusertoConversation,
    emitgroupCreated,
    emitmemberAdd,
    emitmemberRemoved,
    emitgroupUpdated
} = require('../socket/emitterSocket.js');

const findGroup = async (conversationId, notFoundMessage = 'Không tìm thấy nhóm') => {
    const conversation = await Conversation.findOne({ _id: conversationId, isGroup: true });
    if (!conversation) {
        throw new AppError(notFoundMessage, 404);
    }
    return conversation;
};

const isMember = (conversation, userId) =>
    conversation.participants.some((participant) => participant.toString() === userId.toString());

const groupPopulation = [
    { path: 'participants', select: 'username email avatar status' },
    { path: 'admin', select: 'username email avatar' }
];

const createConversation = async ({ currentUserId, userId, io }) => {
    if (!userId) {
        throw new AppError('Thieu userId', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('Id khong hop le', 400);
    }
    if (currentUserId.toString() === userId.toString()) {
        throw new AppError('Khong the tao conversation voi chinh minh', 400);
    }

    const participants = [currentUserId, userId];
    const existingConversation = await Conversation.findOne({ participants: { $all: participants } });
    if (existingConversation) {
        throw new AppError('Conversation da ton tai', 400, { conversation: existingConversation });
    }

    const conversation = await Conversation.create({ participants });
    joinusertoConversation(io, participants, conversation._id);
    return conversation;
};

const getMyConversation = async ({ userId }) => {
    const currentUserId = new mongoose.Types.ObjectId(userId);
    return Conversation.aggregate([
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
};

const createGroup = async ({ currentUserId, name, participants, io }) => {
    if (!name || !name.trim()) {
        throw new AppError('Khong duoc de trong ten nhom', 400);
    }
    if (!Array.isArray(participants) || participants.length < 2) {
        throw new AppError('Nhom can it nhat 3 nguoi', 400);
    }
    if (!participants.every((id) => mongoose.isValidObjectId(id))) {
        throw new AppError('danh sach chua id khong hop le', 400);
    }

    const memberIds = Array.from(
        new Set([currentUserId.toString(), ...participants.map((id) => id.toString())])
    );
    const conversation = await Conversation.create({
        name: name.trim(),
        isGroup: true,
        admin: currentUserId,
        participants: memberIds
    });

    await conversation.populate(groupPopulation);
    joinusertoConversation(io, memberIds, conversation._id);
    emitgroupCreated(io, memberIds, conversation);

    return conversation;
};

const addGroupMembers = async ({ currentUserId, conversationId, memberIds, io }) => {
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
        throw new AppError('Danh sach khong hop le', 400);
    }
    const uniqueMemberIds = Array.from(new Set(memberIds.map((id) => id.toString())));
    if (!uniqueMemberIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        throw new AppError('Có userId không hợp lệ', 400);
    }

    const conversation = await findGroup(conversationId, 'khong tim thay nhom');
    if (!isMember(conversation, currentUserId)) {
        throw new AppError('Ban khong co quyen them thanh vien vao nhom nay', 403);
    }

    const newMembers = uniqueMemberIds.filter((id) => !isMember(conversation, id));
    if (newMembers.length === 0) {
        throw new AppError('tat ca nguoi dung da o trong nhom', 400);
    }

    conversation.participants.push(...newMembers);
    await conversation.save();
    await conversation.populate(groupPopulation);
    joinusertoConversation(io, newMembers, conversation._id);
    emitmemberAdd(io, newMembers, conversation._id, conversation);

    return conversation;
};

const removeGroupMember = async ({ currentUserId, conversationId, userIdToRemove, io }) => {
    if (!mongoose.Types.ObjectId.isValid(userIdToRemove)) {
        throw new AppError('ID thành viên không hợp lệ', 400);
    }

    const conversation = await findGroup(conversationId);
    if (!isMember(conversation, currentUserId)) {
        throw new AppError('Bạn không phải thành viên nhóm', 403);
    }

    const memberId = new mongoose.Types.ObjectId(userIdToRemove).toString();
    const isAdmin = conversation.admin?.toString() === currentUserId.toString();
    const isSelfLeaving = currentUserId.toString() === memberId;
    if (!isAdmin && !isSelfLeaving) {
        throw new AppError('Chỉ Admin mới có quyền xóa thành viên khác', 403);
    }
    if (!isMember(conversation, memberId)) {
        throw new AppError('Thành viên không có trong nhóm', 404);
    }

    conversation.participants = conversation.participants.filter(
        (participant) => participant.toString() !== memberId
    );
    if (isAdmin && isSelfLeaving && conversation.participants.length > 0) {
        conversation.admin = conversation.participants[0];
    }

    await conversation.save();
    emitmemberRemoved(io, conversation._id, memberId, conversation);

    return { conversation, isSelfLeaving };
};

const updateGroup = async ({ currentUserId, conversationId, name, avatar, io }) => {
    const conversation = await findGroup(conversationId);
    if (!isMember(conversation, currentUserId)) {
        throw new AppError('Bạn không phải thành viên nhóm', 403);
    }

    if (name) conversation.name = name.trim();
    if (avatar) conversation.avatar = avatar;

    await conversation.save();
    emitgroupUpdated(io, conversation._id, conversation);

    return conversation;
};

module.exports = {
    createConversation,
    getMyConversation,
    createGroup,
    addGroupMembers,
    removeGroupMember,
    updateGroup
};
