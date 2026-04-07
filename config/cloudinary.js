const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, folder = 'punova') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto',
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' },
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );
        stream.end(buffer);
    });
};

/**
 * Upload a document/file to Cloudinary without image transformations.
 * Suitable for PDFs, Word, Excel files.
 * @param {Buffer} buffer
 * @param {string} folder
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadDocumentToCloudinary = (buffer, folder = 'punova/documents') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'raw',
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );
        stream.end(buffer);
    });
};

/**
 * Delete an asset from Cloudinary.
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, uploadToCloudinary, uploadDocumentToCloudinary, deleteFromCloudinary };
