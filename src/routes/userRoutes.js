const express = require('express');

const { searchUser, getUserbyId } = require('../controllers/userController');

const authMiddleware = require('../middleware/authMiddleware');

const routes = express.Router();

routes.get('/', authMiddleware, searchUser);
routes.get('/:userId', authMiddleware, getUserbyId);

module.exports = routes;

