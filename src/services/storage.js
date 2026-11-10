
const cloudinary = require('../config/cloudinary.js');

const uploadOne = (file, isImage) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: 'appchat',
                resource_type: isImage ? 'image' : 'raw'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        stream.end(file.buffer);
    });

//xoa nhieu file khoi cloudinary
const deleteFiles = async (attachments) => {
    await Promise.allSettled(
        attachments.map((a) =>
            cloudinary.uploader.destroy(a.publicId, {
                resource_type: a.resourceType
            })
        )
    );
};
//upload nhieu file
const uploadFiles = async (items) => {
    const uploaded = [];
    try {
        for (const { file, isImage } of items) {
            const r = await uploadOne(file, isImage);
            uploaded.push({
                url: r.secure_url,
                publicId: r.public_id,
                resourceType: r.resource_type,
                name: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                width: r.width,
                height: r.height
            });
        }
        return uploaded;
    } catch (error) {
        await deleteFiles(uploaded);
        throw error;
    }
};

module.exports = { uploadFiles, deleteFiles };

