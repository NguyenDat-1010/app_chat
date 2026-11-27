const express = require('express');
const { register, login, googleLogin, logout, refresh } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter, authLimiter } = require('../middleware/rateLimitMiddleware');


const routes = express.Router();

routes.get('/test_auth', authMiddleware, (req, res) => {
    res.json({
        message: "Ban da login thanh cong",
        user: req.user
    });
});

routes.post('/register', authLimiter, register);
routes.post('/login', loginLimiter, login);
routes.post('/google', authLimiter, googleLogin);
routes.post('/refresh', authLimiter, refresh);
routes.post('/logout', logout);


module.exports = routes;