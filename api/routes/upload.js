/**
 * Upload Routes
 * File upload handling for images and documents
 */

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { asyncHandler, APIError } = require('../middleware/errorHandler');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new APIError('Invalid file type. Only images are allowed.', 400));
    }
  }
});

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const ensureUploadDir = async () => {
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

/**
 * POST /api/upload
 * Upload single file
 */
router.post('/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new APIError('No file provided', 400);
    }
    
    await ensureUploadDir();
    
    const fileId = uuidv4();
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    
    try {
      // Process image with Sharp
      let processedBuffer = req.file.buffer;
      
      if (req.file.mimetype.startsWith('image/')) {
        processedBuffer = await sharp(req.file.buffer)
          .resize(1920, 1080, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
      }
      
      // Save file
      await fs.writeFile(filePath, processedBuffer);
      
      // Generate file URL
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
      
      res.json({
        file_url: fileUrl,
        file_name: fileName,
        original_name: req.file.originalname,
        size: processedBuffer.length,
        mime_type: req.file.mimetype
      });
      
    } catch (error) {
      console.error('File upload error:', error);
      throw new APIError('Failed to process and save file', 500);
    }
  })
);

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
router.post('/multiple',
  upload.array('files', 10), // Max 10 files
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new APIError('No files provided', 400);
    }
    
    await ensureUploadDir();
    
    const uploadedFiles = [];
    
    for (const file of req.files) {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      try {
        // Process image with Sharp
        let processedBuffer = file.buffer;
        
        if (file.mimetype.startsWith('image/')) {
          processedBuffer = await sharp(file.buffer)
            .resize(1920, 1080, { 
              fit: 'inside',
              withoutEnlargement: true 
            })
            .jpeg({ quality: 85 })
            .toBuffer();
        }
        
        // Save file
        await fs.writeFile(filePath, processedBuffer);
        
        // Generate file URL
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
        
        uploadedFiles.push({
          file_url: fileUrl,
          file_name: fileName,
          original_name: file.originalname,
          size: processedBuffer.length,
          mime_type: file.mimetype
        });
        
      } catch (error) {
        console.error(`File upload error for ${file.originalname}:`, error);
        // Continue with other files, but log the error
      }
    }
    
    res.json({
      uploaded_files: uploadedFiles,
      total_uploaded: uploadedFiles.length,
      total_requested: req.files.length
    });
  })
);

/**
 * DELETE /api/upload/:filename
 * Delete uploaded file
 */
router.delete('/:filename',
  asyncHandler(async (req, res) => {
    const { filename } = req.params;
    
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new APIError('Invalid filename', 400);
    }
    
    const filePath = path.join(uploadDir, filename);
    
    try {
      await fs.unlink(filePath);
      res.json({
        message: 'File deleted successfully'
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new APIError('File not found', 404);
      }
      throw new APIError('Failed to delete file', 500);
    }
  })
);

module.exports = router;
