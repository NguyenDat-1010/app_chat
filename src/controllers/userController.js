const mongoose = require('mongoose');
const User = require('../models/User');
const { uploadOne } = require('../services/storage.js');

const searchUser = async (req, res, next) => {
    try {
        const { search } = req.query;
        if (!search) {
            return res.status(400).json({
                message: 'Chua nhap user'
            });
        }
        const currentUserId = req.user.userId;
        //tim kiem user
        const user = await User.find(
            {
                _id: { $ne: currentUserId },
                $or: [
                    {
                        username: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        email: {
                            $regex: search,
                            $options: 'i'
                        }
                    }
                ]
            }
        )
            .select('username email avatar status')
            .limit(20);
        res.status(200).json({
            message: 'Tim user thanh cong',
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const getUserbyId = async (req, res, next) => {
    try {
        const { userId } = req.params;
        //kiem tra xem co phai object hop le trong mongoose khong
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'ID khong hop le'
            });
        }
        const user = await User.findById(userId).select(' username email avatar status ');
        if (!user) {
            return res.status(404).json({
                message: 'User khong ton tai'
            });
        }
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
        const userId = req.user.userId;
        // 1. Kiểm tra xem người dùng có chọn file không
        if (!req.file) {
            return res.status(400).json({
                message: 'Vui lòng chọn file hình ảnh'
            });
        }
        // 2. Kiểm tra định dạng có phải là ảnh không
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                message: 'Chỉ chấp nhận tệp hình ảnh'
            });
        }
        // 3. Upload file buffer lên Cloudinary
        const result = await uploadOne(req.file, true);
        // 4. Cập nhật link avatar vào MongoDB
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatar: result.secure_url },
            { new: true } // Trả về document sau khi update
        ).select('username email avatar status createdAt');
        if (!updatedUser) {
            return res.status(404).json({
                message: 'Người dùng không tồn tại'
            });
        }
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