const express = require('express');
const { createConversation, getMyConversation, creatGroup, addmembertoGroup, removememberfromGroup, updateGroup } = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');

const routes = express.Router();

//1-1 chat
routes.post('/create', authMiddleware, createConversation);
routes.get('/', authMiddleware, getMyConversation);

//groupchat

routes.post('/group/create', authMiddleware, creatGroup);
routes.put('/group/:conversationId/add', authMiddleware, addmembertoGroup);
routes.put('/group/:conversationId/remove', authMiddleware, removememberfromGroup);
routes.put('/group/:conversationId', authMiddleware, updateGroup);

module.exports = routes;