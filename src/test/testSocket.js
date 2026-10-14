const { io } = require('socket.io-client');
const socket = io('http://localhost:4000');

socket.on('connect', () => {
    console.log('Connected to server:');
    console.log('Socket ID:', socket.id);
    socket.emit('test_event', {
        message: 'hello server'
    }
    );
});
socket.on('test_response', (data) => {
    console.log('Data from server:', data);
});

//khi kết nối lỗi

socket.on('connect_error', (error) => {
    console.log('Connect error:', error.message);
});
//khi ngat ket noi
socket.on('disconnect', (reason) => {
    console.log('Da ngat ket noi:', reason);
});