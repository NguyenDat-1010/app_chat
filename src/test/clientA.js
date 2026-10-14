const { io } = require('socket.io-client');
const socket = io('http://localhost:4000');
const conversationId = 'conversation_123';
socket.on('connect', () => {
    console.log('Client connected:', socket.id);
    socket.emit('join_conversation', conversationId);
    setTimeout(() => {
        socket.emit('send_message', {
            conversationId,
            message: 'hello client B',
            sender: 'Client A'
        });
    }, 2000);
});

socket.on('receive_message', (data) => {
    console.log('client A nhan tin nhan:', data);
});
