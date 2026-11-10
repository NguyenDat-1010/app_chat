require('dotenv').config();
const { uploadFiles, deleteFiles } = require('../services/storage.js');

const run = async () => {
    try {
        const fakeFile = {
            originalname: 'gichu.txt',
            mimeType: 'text/plain',
            size: 11,
            buffer: Buffer.from('helloworld'),
        };
        const result = await uploadFiles([{ file: fakeFile, isImage: false }]);
        console.log('Upload Ok:', result);

        await deleteFiles(result);
        console.log('Da xóa');
    } catch (error) {
        console.log(error);
    }

};

run();