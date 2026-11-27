
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
//upload nhieu file dong thoi (parallel upload)
const uploadFiles = async (items) => {
    const results = await Promise.allSettled(
        items.map(async ({ file, isImage }) => {
            const r = await uploadOne(file, isImage);
            return {
                url: r.secure_url,
                publicId: r.public_id,
                resourceType: r.resource_type,
                name: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                width: r.width,
                height: r.height
            };
        })
    );

    const uploaded = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);
    const failed = results.find((result) => result.status === 'rejected');
    if (failed) {
        await deleteFiles(uploaded);
        throw failed.reason;
    }

    return uploaded;
};

module.exports = { uploadFiles, deleteFiles, uploadOne };

