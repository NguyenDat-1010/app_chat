const jwt = require('jsonwebtoken');



const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                message: 'Khong co token'
            });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                message: 'Token khong hop le'
            });
        }
        const decode = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = decode;
        //cho tiep tuc di
        next();
    } catch (error) {
        res.status(401).json({
            message: 'Token khong hop le',
            error: error.message
        });
    }
};

module.exports = authMiddleware;