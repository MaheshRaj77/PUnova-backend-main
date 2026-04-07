const multer = require('multer');

// Store files in memory as buffers — we'll stream to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            // Images
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            // Documents
            'application/pdf',
            'application/msword',                                                     // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel',                                               // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // .xlsx
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: images, PDF, Word, Excel.'));
        }
    },
});

module.exports = { upload };
