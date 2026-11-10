const express = require('express');
const { createMessage, getMessage, markasRead } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware.js');

const routes = express.Router();

routes.post('/', authMiddleware, uploadMiddleware.array('files', 5), createMessage);
routes.get('/:conversationId', authMiddleware, getMessage);
routes.patch('/:conversationId/read', authMiddleware, markasRead);

module.exports = routes;