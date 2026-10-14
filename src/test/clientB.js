const { io } = require('socket.io-client');
const token = process.argv[2];
const socket = io('http://localhost:4000', {
    auth: { token }
});
const conversationId = 'conversation_12';
socket.on('connect', () => {
    console.log('Client connected:', socket.id);
    socket.emit('join_conversation', conversationId);
});
socket.on('hello', (data) => {
    console.log('Data from server:', data);
});