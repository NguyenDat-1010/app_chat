const FileType = require('file-type'); // bản 16 dùng require được

// Whitelist: chi cho phep nhung loai nay
const ALLOWED = {
    'image/jpeg': { ext: 'jpg', isImage: true },
    'image/png': { ext: 'png', isImage: true },
    'image/webp': { ext: 'webp', isImage: true },
    'image/gif': { ext: 'gif', isImage: true },
    'application/pdf': { ext: 'pdf', isImage: false },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', isImage: false },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', isImage: false },
    'application/zip': { ext: 'zip', isImage: false }
};

const TEXT_EXT = ['txt', 'csv'];

const checkFile = async (file) => {
    const detected = await FileType.fromBuffer(file.buffer);

    // 1. Co magic bytes: phai nam trong whitelist
    if (detected) {
        const rule = ALLOWED[detected.mime];
        if (!rule) {
            const err = new Error(`Loai file khong duoc phep: ${file.originalname}`);
            err.status = 400;
            throw err;
        }
        return { isImage: rule.isImage };
    }

    // 2. Khong co magic bytes: chi cho txt/csv (file chu khong co chu ky)
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (TEXT_EXT.includes(ext)) {
        // chan file co ky tu NUL (dau hieu file nhi phan)
        if (file.buffer.includes(0)) {
            const err = new Error(`File ${file.originalname} khong phai file van ban`);
            err.status = 400;
            throw err;
        }
        return { isImage: false };
    }

    const err = new Error(`Khong nhan dien duoc file: ${file.originalname}`);
    err.status = 400;
    throw err;
};

module.exports = { checkFile };