// config/cloudinary.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const serviceHealth = require('../utils/serviceHealth');

// Verify configuration on startup
const verifyCloudinaryConfig = () => {
    const { cloud_name, api_key, api_secret } = cloudinary.config();

    if (!cloud_name || !api_key || !api_secret) {
        console.warn('⚠️  Cloudinary configuration incomplete. Avatar uploads will not work.');
        try {
            serviceHealth.setStatus('cloudinary', false);
        } catch (e) {
            // ignore
        }
        return false;
    }

    console.log('✅ Cloudinary configured successfully');
    try {
        serviceHealth.setStatus('cloudinary', true);
    } catch (e) {
        // ignore
    }
    return true;
};

/**
 * Upload image to Cloudinary
 * @param {String} filePath - Path to the file or base64 string
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (filePath, options = {}) => {
    try {
        const defaultOptions = {
            folder: 'votingapp/avatars',
            resource_type: 'image',
            transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ],
            ...options
        };

        const result = await cloudinary.uploader.upload(filePath, defaultOptions);
        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return {
            success: result.result === 'ok',
            result: result.result
        };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error(`Failed to delete image: ${error.message}`);
    }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {String} url - Cloudinary URL
 * @returns {String|null} Public ID or null
 */
const extractPublicId = (url) => {
    if (!url || typeof url !== 'string') return null;
    
    try {
        // Match pattern: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage,
    extractPublicId,
    verifyCloudinaryConfig
};
