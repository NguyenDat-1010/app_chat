const mongoose = require('mongoose');
const User = require('../models/User');

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

module.exports = {
    searchUser,
    getUserbyId

};