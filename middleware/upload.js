const multer = require('multer');

// Store files in memory as buffers — we'll stream to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
        }
    },
});

module.exports = { upload };
