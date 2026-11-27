const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.js');
const Refreshtoken = require('../models/Refreshtoken.js');
const AppError = require('../utils/appError.js');
const { hashToken, signaccessToken, issuerefreshToken } = require('../utils/token.js');

const register = async ({ username, email, password }) => {
    if (!username || !email || !password) {
        throw new AppError('Nhap thieu thong tin', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Email da ton tai', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    return {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status
    };
};

const login = async ({ email, password }) => {
    if (!email || !password) {
        throw new AppError('Nhap thieu  thong tin', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('User khong ton tai', 400);
    }

    if (!user.password) {
        throw new AppError('Tai khoan nay su dung dang nhap Google', 400);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new AppError('Email hoac password khong dung', 400);
    }

    const accessToken = signaccessToken(user._id);
    const refreshToken = await issuerefreshToken(user._id);
    return { accessToken, refreshToken };
};

const refresh = async ({ refreshToken }) => {
    if (!refreshToken) {
        throw new AppError('Thieu refresh token', 400);
    }

    const tokenHash = hashToken(refreshToken);
    const now = new Date();

    // Thu hồi nguyên tử để chỉ một request có thể dùng token này để làm mới.
    const stored = await Refreshtoken.findOneAndUpdate(
        { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
        { revokedAt: now }
    );
    if (!stored) {
        // Token đã bị thu hồi mà vẫn được dùng lại có thể đã bị lộ.
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
        throw new AppError('Refresh token khong hop le', 401);
    }

    const accessToken = signaccessToken(stored.user);
    const newRefreshToken = await issuerefreshToken(stored.user);
    return { accessToken, refreshToken: newRefreshToken };
};

const logout = async ({ refreshToken }) => {
    if (refreshToken) {
        await Refreshtoken.updateOne(
            { tokenHash: hashToken(refreshToken), revokedAt: null },
            { revokedAt: new Date() }
        );
    }
};

const generateUniqueUsername = async (rawName) => {
    const base = (rawName || 'user')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .slice(0, 20) || 'user';

    const existing = await User.findOne({ username: base }).select('_id');
    if (!existing) {
        return base;
    }

    return `${base}_${crypto.randomBytes(3).toString('hex')}`;
};

const googleLogin = async ({ idToken }) => {
    if (typeof idToken !== 'string' || !idToken.trim()) {
        throw new AppError('Thieu Google ID token', 400);
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
        throw new AppError('Chua cau hinh GOOGLE_CLIENT_ID tren server', 500);
    }

    let payload;
    try {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
            idToken: idToken.trim(),
            audience: googleClientId
        });
        payload = ticket.getPayload();
    } catch (error) {
        throw new AppError('Google token khong hop le', 401);
    }

    if (!payload?.email || !payload?.email_verified) {
        throw new AppError('Email Google chua duoc xac minh', 401);
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;

    let user = await User.findOne({
        $or: [{ googleId }, { email }]
    });

    if (!user) {
        const username = await generateUniqueUsername(payload.name || email.split('@')[0]);
        user = await User.create({
            username,
            email,
            googleId,
            authProvider: 'google',
            avatar: payload.picture || ''
        });
    } else {
        let shouldSave = false;
        if (!user.googleId) {
            user.googleId = googleId;
            shouldSave = true;
        }
        if (!user.avatar && payload.picture) {
            user.avatar = payload.picture;
            shouldSave = true;
        }
        if (shouldSave) {
            await user.save();
        }
    }

    const accessToken = signaccessToken(user._id);
    const refreshToken = await issuerefreshToken(user._id);
    return { accessToken, refreshToken };
};

module.exports = { register, login, googleLogin, refresh, logout };
