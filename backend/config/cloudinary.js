import { v2 as cloudinary } from 'cloudinary';
import { config } from './env.js';
import logger from '../utils/logger.js';

let isCloudinaryConfigured = false;

// Validate Cloudinary environment keys
if (
  config.cloudinaryCloudName &&
  config.cloudinaryCloudName !== 'your_cloud_name' &&
  config.cloudinaryApiKey &&
  config.cloudinaryApiKey !== 'your_api_key' &&
  config.cloudinaryApiSecret &&
  config.cloudinaryApiSecret !== 'your_api_secret'
) {
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  });
  isCloudinaryConfigured = true;
  logger.info('☁️ Cloudinary integration initialized successfully');
} else {
  logger.warn('☁️ Cloudinary credentials are missing or default. Falling back to Mock Media Uploader.');
}

export { cloudinary, isCloudinaryConfigured };
export default cloudinary;
