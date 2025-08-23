import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload and process image
router.post('/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    const filename = `${uuidv4()}.webp`;
    const uploadDir = path.join(__dirname, '../../uploads');
    const filepath = path.join(uploadDir, filename);
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Process and optimize image
    await sharp(req.file.buffer)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toFile(filepath);
    
    // Return the URL path
    const imageUrl = `/uploads/${filename}`;
    
    res.json({ 
      success: true,
      url: imageUrl,
      filename: filename
    });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Delete an uploaded image
router.delete('/image/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Validate filename format
    if (!/^[a-f0-9-]+\.(webp|jpg|jpeg|png|gif)$/i.test(filename)) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const filepath = path.join(__dirname, '../../uploads', filename);
    
    // Check if file exists
    await fs.access(filepath);
    
    // Delete the file
    await fs.unlink(filepath);
    
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Image not found' });
    }
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;