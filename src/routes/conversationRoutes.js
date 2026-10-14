const express = require('express');
const { createConversation, getMyConversation } = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

const routes = express.Router();


routes.post('/create', authMiddleware, createConversation);
routes.get('/', authMiddleware, getMyConversation);

module.exports = routes;