const { io } = require('socket.io-client');
const token = process.argv[2];
const socket = io('http://localhost:4000', {
    auth: { token }
});

socket.on('connect', () => {
    console.log('Client connected:', socket.id);

});
socket.on('message:new', (msg) => {
    console.log('Data from server:', msg);
});
