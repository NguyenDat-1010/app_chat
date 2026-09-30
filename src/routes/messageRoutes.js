const express = require('express');
const { createMessage, getMessage } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const routes = express.Router();

routes.post('/', authMiddleware, createMessage);
routes.get('/:conversationId', authMiddleware, getMessage);

module.exports = routes;