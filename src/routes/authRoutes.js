const express = require('express');
const { register, login } = require('../controllers/authController');
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


module.exports = routes;