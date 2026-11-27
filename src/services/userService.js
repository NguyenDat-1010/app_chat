const mongoose = require('mongoose');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { uploadOne } = require('./storage');

const MAX_SEARCH_LENGTH = 100;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const searchUsers = async ({ search, currentUserId }) => {
    if (search === undefined || search === null) {
        throw new AppError('Chua nhap user', 400);
    }
    if (typeof search !== 'string') {
        throw new AppError('Tu khoa tim kiem khong hop le', 400);
    }

    const trimmedSearch = search.trim();
    if (!trimmedSearch) {
        throw new AppError('Chua nhap user', 400);
    }
    if (trimmedSearch.length > MAX_SEARCH_LENGTH) {
        throw new AppError(`Tu khoa tim kiem toi da ${MAX_SEARCH_LENGTH} ky tu`, 400);
    }

    const safePattern = escapeRegex(trimmedSearch);

    return User.find({
        _id: { $ne: currentUserId },
        $or: [
            { username: { $regex: safePattern, $options: 'i' } },
            { email: { $regex: safePattern, $options: 'i' } }
        ]
    })
        .select('username email avatar status')
        .limit(20);
};

const getUserById = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new AppError('ID khong hop le', 400);
    }

    const user = await User.findById(userId).select('username email avatar status');
    if (!user) {
        throw new AppError('User khong ton tai', 404);
    }

    return user;
};


const updateAvatar = async ({ userId, file }) => {
    if (!file) {
        throw new AppError('Vui lòng chọn file hình ảnh', 400);
    }

    if (!file.mimetype.startsWith('image/')) {
        throw new AppError('Chỉ chấp nhận tệp hình ảnh', 400);
    }

    const result = await uploadOne(file, true);

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { avatar: result.secure_url },
        { new: true }
    ).select('username email avatar status createdAt');

    if (!updatedUser) {
        throw new AppError('Người dùng không tồn tại', 404);
    }

    return updatedUser;
};

module.exports = {
    searchUsers,
    getUserById,
    updateAvatar
};
