import multer from 'multer';
import { AppError } from './errorHandler.js';

// Setup memory storage to hold buffer before forwarding to CDN
const storage = multer.memoryStorage();

// File filter validator - reject non-image file extensions
const fileFilter = (req, file, callback) => {
  if (file.mimetype.startsWith('image/')) {
    callback(null, true);
  } else {
    callback(new AppError('Only image files (JPEG, PNG, WEBP) are allowed!', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default upload;
