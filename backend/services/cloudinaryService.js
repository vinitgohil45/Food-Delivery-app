import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

// Mocks database of beautiful Unsplash food items to return during simulation
const MOCK_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=600',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=600',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=600',
];

/**
 * Upload Image Buffer to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {String} folder - Target Cloudinary folder
 * @returns {Promise<{url: String, publicId: String}>}
 */
export const uploadImage = async (fileBuffer, folder = 'cravego') => {
  if (!isCloudinaryConfigured) {
    // Return a random Unsplash placeholder URL during local simulation
    const mockUrl = MOCK_FOOD_IMAGES[Math.floor(Math.random() * MOCK_FOOD_IMAGES.length)];
    logger.info(`☁️ Simulated Upload: Returning mock image URL [${mockUrl}]`);
    return {
      url: mockUrl,
      publicId: `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          logger.error('☁️ Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete Image from Cloudinary
 * @param {String} publicId - Cloudinary asset public ID
 */
export const deleteImage = async (publicId) => {
  if (!isCloudinaryConfigured || publicId.startsWith('mock_')) {
    logger.info(`☁️ Simulated Delete: Image [${publicId}] deleted.`);
    return { result: 'ok' };
  }

  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(`☁️ Cloudinary asset destruction failed for ID [${publicId}]:`, error);
    throw error;
  }
};
