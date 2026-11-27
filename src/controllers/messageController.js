const messageService = require('../services/messageService');

const createMessage = async (req, res, next) => {
    try {
        const message = await messageService.createMessage({
            userId: req.user.userId,
            conversationId: req.body.conversationId,
            content: req.body.content,
            files: req.files || [],
            io: req.app.get('io')
        });

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
        const { data, pagination } = await messageService.getMessages({
            userId: req.user.userId,
            conversationId: req.params.conversationId,
            limit: req.query.limit,
            before: req.query.before
        });

        res.status(200).json({
            message: 'Lay message thanh cong',
            data,
            pagination
        });
    } catch (error) {
        next(error);
    }
};

const markasRead = async (req, res, next) => {
    try {
        const result = await messageService.markAsRead({
            userId: req.user.userId,
            conversationId: req.params.conversationId,
            io: req.app.get('io')
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createMessage,
    getMessage,
    markasRead
};
