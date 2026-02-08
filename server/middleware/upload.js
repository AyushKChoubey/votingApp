// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll upload to Cloudinary directly)
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File size too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({
            error: `Upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            error: err.message || 'Invalid file upload'
        });
    }
    next();
};

module.exports = {
    upload,
    handleMulterError
};
