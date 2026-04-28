const cloudinary = require('cloudinary').v2;
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
});

// Validate Cloudinary configuration early to avoid runtime surprises
const NODE_ENV = process.env.NODE_ENV || 'development';
if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_SECRET) {
    const msg = 'Cloudinary configuration missing: CLOUDINARY_NAME/CLOUDINARY_KEY/CLOUDINARY_SECRET must be set.';
    if (NODE_ENV === 'production') {
        logger.error(msg);
        throw new Error(msg);
    } else {
        logger.warn(msg);
    }
}

// Ensure uploads directory exists for local fallback
const uploadsDir = path.join(__dirname, '../uploads');
function ensureUploadsDir() {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    return uploadsDir;
}

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, folder = 'punova') => {
    // Fallback to local file storage when Cloudinary not configured
    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_SECRET) {
        try {
            ensureUploadsDir();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.bin`;
            const dst = path.join(uploadsDir, fileName);
            fs.writeFileSync(dst, buffer);
            return Promise.resolve({ url: `/uploads/${fileName}`, publicId: null });
        } catch (err) {
            return Promise.reject(err);
        }
    }

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
    // Fallback to local file storage when Cloudinary not configured
    if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_KEY || !process.env.CLOUDINARY_SECRET) {
        try {
            ensureUploadsDir();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.bin`;
            const dst = path.join(uploadsDir, fileName);
            fs.writeFileSync(dst, buffer);
            return Promise.resolve({ url: `/uploads/${fileName}`, publicId: null });
        } catch (err) {
            return Promise.reject(err);
        }
    }

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
