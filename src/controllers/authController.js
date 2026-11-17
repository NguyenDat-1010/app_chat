const bcrypt = require('bcrypt');
const User = require('../models/User.js');
const Refreshtoken = require('../models/Refreshtoken.js');
const jwt = require('jsonwebtoken');

const { hashToken, signaccessToken, issuerefreshToken } = require('../untils/token.js');


const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        //kiem tra du lieu co day du khong

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Nhap thieu thong tin' });
        }

        //kiem tra user da ton tai chua
        const exitingUser = await User.findOne({ email });
        if (exitingUser) {
            return res.status(400).json({ message: 'Email da ton tai' })
        }
        //Hash  password

        const hashedPassword = await bcrypt.hash(password, 10);

        //tao user moi

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });


        //khong tra password cho client
        res.status(201).json({
            message: 'Dang ki thanh cong',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                status: user.status
            }
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        //kiem tra du lieu

        if (!email || !password) {
            return res.status(400).json({
                message: 'Nhap thieu  thong tin'
            });
        }
        //tim user bang email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: 'User khong ton tai'
            });
        }
        //so sanh password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: 'Email hoac password khong dung'
            });
        }

        //tao JWT token
        const accessToken = signaccessToken(user._id);
        const refreshToken = await issuerefreshToken(user._id);

        //Tra ket qua
        return res.status(200).json({
            message: 'Login thanh cong',
            accessToken,
            refreshToken
        });


    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Thieu refresh token' });
        }

        const tokenHash = hashToken(refreshToken);
        const now = new Date();

        // Thu hồi nguyên tử: chỉ một request thắng nếu gửi trùng cùng lúc
        const stored = await Refreshtoken.findOneAndUpdate(
            { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
            { revokedAt: now }
        );

        if (!stored) {
            // Token đã bị thu hồi mà vẫn được dùng lại → nghi bị lộ
            const reused = await Refreshtoken.findOne({
                tokenHash,
                revokedAt: { $ne: null }
            });
            if (reused) {
                await Refreshtoken.updateMany(
                    { user: reused.user, revokedAt: null },
                    { revokedAt: now }
                );
            }
            return res.status(401).json({ message: 'Refresh token khong hop le' });
        }

        const accessToken = signaccessToken(stored.user);
        const newRefreshToken = await issuerefreshToken(stored.user);

        res.status(200).json({
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await Refreshtoken.updateOne(
                { tokenHash: hashToken(refreshToken), revokedAt: null },
                { revokedAt: new Date() }
            );
        }
        res.status(200).json({ message: 'Dang xuat thanh cong' });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    register,
    login,
    logout,
    refresh
};
