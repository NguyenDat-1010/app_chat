const multer = require('multer');
const errorMiddleware = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let status = err.status || err.statuscode || 500;
    let message = err.message || 'Server error';

    if (err instanceof multer.MulterError) {
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                status = 413;
                message = 'File vuot qua 10MB';
                break;
            case 'LIMIT_FILE_COUNT':
                status = 400;
                message = 'Toi da 5 file moi tin nhan';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                status = 400;
                message = err.field === 'files'
                    ? 'Toi da 5 file moi tin nhan'
                    : `Sai ten truong file "${err.field}", phai dung "files"`;
                break;
            default:
                status = 400;
                message = 'Loi khi upload file';
        }
    }

    if (status >= 500) {
        console.error('ERROR:', err);
    }

    res.status(status).json({ message });
};

module.exports = errorMiddleware; 