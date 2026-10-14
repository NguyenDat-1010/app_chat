const jwt = require('jsonwebtoken');


const authSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;
        //kiem tra xem co token hay khong
        if (!token) {
            console.log('Khong co token ');
            return next(new Error('khong co token'));
        }
        const cleanToken = token.replace(/^Bearer\s+/i, '');
        const decode = jwt.verify(cleanToken, process.env.JWT_SECRET);
        //gan thong tin user vao socket
        socket.user = decode;
        next();
    } catch (error) {
        next(new Error('Token khong hop le'));
    }
};

module.exports = authSocket;

