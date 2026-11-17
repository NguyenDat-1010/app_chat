const express = require('express');
const { register, login, logout, refresh } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');


const routes = express.Router();

routes.get('/test_auth', authMiddleware, (req, res) => {
    res.json({
        message: "Ban da login thanh cong",
        user: req.user
    });
});

routes.post('/register', register);
routes.post('/login', login);
routes.post('/refresh', refresh);
routes.post('/logout', logout);


module.exports = routes;