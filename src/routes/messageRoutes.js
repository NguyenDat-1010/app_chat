const express = require('express');
const { createMessage, getMessage, markasRead } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

const routes = express.Router();

routes.post('/', authMiddleware, createMessage);
routes.get('/:conversationId', authMiddleware, getMessage);
routes.patch('/:conversationId/read', authMiddleware, markasRead);

module.exports = routes;