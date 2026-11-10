const multer = require('multer');

const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limit: {
        fileSize: 10 * 1024 * 1024,
        files: 5
    }
});

module.exports = uploadMiddleware;