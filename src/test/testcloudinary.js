require('dotenv').config();
const cloudinary = require('../config/cloudinary.js');

const run = async () => {
    try {
        // 1. Kiểm tra key có đúng không
        const ping = await cloudinary.api.ping();
        console.log('Ket noi OK:', ping);

        // 2. Thử upload một ảnh nhỏ từ URL mẫu của Cloudinary
        const result = await cloudinary.uploader.upload(
            'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            { folder: 'appchat-test' }
        );
        console.log('Upload OK:');
        console.log('  url:', result.secure_url);
        console.log('  publicId:', result.public_id);
        console.log('  size:', result.width, 'x', result.height);

        // 3. Xóa ảnh vừa upload để dọn dẹp
        const del = await cloudinary.uploader.destroy(result.public_id);
        console.log('Xoa:', del); // { result: 'ok' }
    } catch (error) {
        console.error('Loi:', error.message || error);
    }
};

run();