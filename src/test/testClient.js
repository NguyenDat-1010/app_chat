const { io } = require('socket.io-client');

const token = process.argv[2];
const socket = io('http://localhost:4000', { auth: { token } });

socket.on('connect', () => {
    console.log('Connected:', socket.id);
    socket.emit('users:online', (list) => console.log('Dang online:', list));
});
socket.on('connect_error', (err) => console.log('Error:', err.message));

socket.on('user:status', (data) => console.log('STATUS:', data));
socket.on('message:new', (msg) => console.log('NEW MESSAGE:', msg));
socket.on('message:read', (data) => console.log('READ:', data));