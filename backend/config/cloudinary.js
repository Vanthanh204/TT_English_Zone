const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadToCloudinary = (file, folder, resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    // Determine appropriate resource type
    // If it's a PDF or an Image, we can set 'image' to let Cloudinary serve it inline in the browser
    let finalResourceType = resourceType;
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      finalResourceType = 'image';
    } else {
      finalResourceType = 'raw';
    }

    const publicId = finalResourceType === 'raw' 
      ? `${Date.now()}-${baseName}${ext}` 
      : `${Date.now()}-${baseName}`;

    const options = {
      folder: `english_zone/${folder}`,
      resource_type: finalResourceType,
      public_id: publicId
    };

    // If it is an image or PDF, we can specify the format to ensure Cloudinary appends the extension correctly
    if (finalResourceType === 'image' && ext) {
      options.format = ext.substring(1).toLowerCase();
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(file.buffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary
};
