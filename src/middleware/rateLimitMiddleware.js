const rateLimit = require('express-rate-limit');

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

/**
 * Create a standardized Express rate-limit middleware.
 */
const createLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        message: { message }
    });

// Gioi han chung cho toan bo /api/*
const apiLimiter = createLimiter({
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 200,
    message: 'Qua nhieu yeu cau, vui long thu lai sau'
});

// Gioi han chat cho /api/auth/login (chi dem cac lan dang nhap that bai)
const loginLimiter = createLimiter({
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 10,
    skipSuccessfulRequests: true,
    message: 'Dang nhap sai qua nhieu lan, vui long thu lai sau 15 phut'
});

// Gioi han cho /api/auth/register va /api/auth/refresh
const authLimiter = createLimiter({
    windowMs: FIFTEEN_MINUTES_MS,
    limit: 20,
    message: 'Qua nhieu yeu cau xac thuc, vui long thu lai sau 15 phut'
});

module.exports = {
    apiLimiter,
    loginLimiter,
    authLimiter
};
