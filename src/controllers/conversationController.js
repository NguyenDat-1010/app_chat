const conversationService = require('../services/conversationService');

const createConversation = async (req, res, next) => {
    try {
        const conversation = await conversationService.createConversation({
            currentUserId: req.user.userId,
            userId: req.body.userId,
            io: req.app.get('io')
        });

        res.status(200).json({ message: 'tao conservation thanh cong', conversation });
    } catch (error) {
        next(error);
    }
};

const getMyConversation = async (req, res, next) => {
    try {
        const conversations = await conversationService.getMyConversation({ userId: req.user.userId });

        res.status(200).json({ message: 'Lay danh sach conversation thanh cong', data: conversations });
    } catch (error) {
        next(error);
    }
};

const creatGroup = async (req, res, next) => {
    try {
        const { name, participants } = req.body;
        const conversation = await conversationService.createGroup({
            currentUserId: req.user.userId,
            name,
            participants,
            io: req.app.get('io')
        });

        res.status(200).json({ message: 'Tao nhom thanh cong', conversation });
    } catch (error) {
        next(error);
    }
};

const addmembertoGroup = async (req, res, next) => {
    try {
        const conversation = await conversationService.addGroupMembers({
            currentUserId: req.user.userId,
            conversationId: req.params.conversationId,
            memberIds: req.body.memberIds,
            io: req.app.get('io')
        });

        res.status(200).json({ message: 'Them thanh cong', conversation });
    } catch (error) {
        next(error);
    }
};

const removememberfromGroup = async (req, res, next) => {
    try {
        const { conversation, isSelfLeaving } = await conversationService.removeGroupMember({
            currentUserId: req.user.userId,
            conversationId: req.params.conversationId,
            userIdToRemove: req.body.userIdToRemove,
            io: req.app.get('io')
        });

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
        const { name, avatar } = req.body;
        const conversation = await conversationService.updateGroup({
            currentUserId: req.user.userId,
            conversationId: req.params.conversationId,
            name,
            avatar,
            io: req.app.get('io')
        });

        res.status(200).json({ message: 'Cập nhật nhóm thành công', conversation });
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
