const authService = require('../services/authService');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);

const getRefreshCookieOptions = () => {
    const isProd = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/api/auth',
        maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000
    };
};

const getClearCookieOptions = () => {
    const { maxAge, ...options } = getRefreshCookieOptions();
    return options;
};

const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const user = await authService.register({ username, email, password });

        res.status(201).json({
            message: 'Dang ki thanh cong',
            user
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { accessToken, refreshToken } = await authService.login({ email, password });

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

        return res.status(200).json({
            message: 'Login thanh cong',
            accessToken
        });
    } catch (error) {
        next(error);
    }
};

const googleLogin = async (req, res, next) => {
    try {
        const { idToken } = req.body;
        const { accessToken, refreshToken } = await authService.googleLogin({ idToken });

        res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

        return res.status(200).json({
            message: 'Login thanh cong',
            accessToken
        });
    } catch (error) {
        next(error);
    }
};

const refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        const tokens = await authService.refresh({ refreshToken });

        res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getRefreshCookieOptions());

        res.status(200).json({ accessToken: tokens.accessToken });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
        await authService.logout({ refreshToken });

        res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

        res.status(200).json({ message: 'Dang xuat thanh cong' });
    } catch (error) {
        next(error);
    }
};

module.exports = { register, login, googleLogin, logout, refresh };
