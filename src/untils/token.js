const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Refreshtoken = require('../models/Refreshtoken.js');
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);

const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

const signaccessToken = (userId) =>
    jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '15m'
    });

const issuerefreshToken = async (userId) => {
    const token = crypto.randomBytes(64).toString('hex');

    await Refreshtoken.create({
        user: userId,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000)
    });

    return token; // bản gốc chỉ trả cho client, DB chỉ giữ hash
};

module.exports = { hashToken, signaccessToken, issuerefreshToken };

