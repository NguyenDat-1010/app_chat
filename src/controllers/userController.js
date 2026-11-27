const userService = require('../services/userService');

const searchUser = async (req, res, next) => {
    try {
        const users = await userService.searchUsers({
            search: req.query.search,
            currentUserId: req.user.userId
        });

        res.status(200).json({
            message: 'Tim user thanh cong',
            data: users
        });
    } catch (error) {
        next(error);
    }
};

const getUserbyId = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.userId);

        res.status(200).json({
            message: 'Da tim thay user',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const updateAvatar = async (req, res, next) => {
    try {
        const updatedUser = await userService.updateAvatar({
            userId: req.user.userId,
            file: req.file
        });

        res.status(200).json({
            message: 'Cập nhật ảnh đại diện thành công',
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    searchUser,
    getUserbyId,
    updateAvatar
};
