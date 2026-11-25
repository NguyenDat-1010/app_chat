const express = require('express');

const { searchUser, getUserbyId, updateAvatar } = require('../controllers/userController');

const authMiddleware = require('../middleware/authMiddleware'); const uploadMiddleware = require('../middleware/uploadMiddleware');


const routes = express.Router();

routes.get('/', authMiddleware, searchUser);
routes.patch('/profile', authMiddleware, uploadMiddleware.single('avatar'), updateAvatar);
routes.get('/:userId', authMiddleware, getUserbyId);

module.exports = routes;

