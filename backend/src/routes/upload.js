import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getOne, getAll } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

// Image-only upload for profile photos
const imageUpload = multer({
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

// General file upload for attachments (images, PDFs, etc.)
const attachmentUpload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|csv|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Upload and process profile image
router.post('/image', imageUpload.single('image'), async (req, res) => {
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

// Upload task attachment
router.post('/task/:taskId/attachment', attachmentUpload.single('file'), async (req, res) => {
  const { taskId } = req.params;
  const { uploadedBy } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const filename = `${uuidv4()}${fileExt}`;
    const uploadDir = path.join(__dirname, '../../uploads/attachments');
    const filepath = path.join(uploadDir, filename);
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Process based on file type
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileExt)) {
      // Process image - resize if needed
      await sharp(req.file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(filepath);
    } else {
      // Save other files as-is
      await fs.writeFile(filepath, req.file.buffer);
    }
    
    // Save to database
    const attachmentUrl = `/uploads/attachments/${filename}`;
    const result = await runQuery(
      `INSERT INTO task_attachments (task_id, filename, original_name, url, type, size, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [taskId, filename, req.file.originalname, attachmentUrl, req.file.mimetype, req.file.size, uploadedBy || null]
    );
    
    res.json({ 
      success: true,
      attachment: {
        id: result.id,
        url: attachmentUrl,
        filename: filename,
        originalName: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error processing attachment:', error);
    res.status(500).json({ error: 'Failed to process attachment' });
  }
});

// Upload comment attachment
router.post('/comment/:commentId/attachment', attachmentUpload.single('file'), async (req, res) => {
  const { commentId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const filename = `${uuidv4()}${fileExt}`;
    const uploadDir = path.join(__dirname, '../../uploads/attachments');
    const filepath = path.join(uploadDir, filename);
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Process based on file type
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileExt)) {
      // Process image
      await sharp(req.file.buffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toFile(filepath);
    } else {
      // Save other files as-is
      await fs.writeFile(filepath, req.file.buffer);
    }
    
    // Save to database
    const attachmentUrl = `/uploads/attachments/${filename}`;
    const result = await runQuery(
      `INSERT INTO comment_attachments (comment_id, filename, original_name, url, type, size) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [commentId, filename, req.file.originalname, attachmentUrl, req.file.mimetype, req.file.size]
    );
    
    res.json({ 
      success: true,
      attachment: {
        id: result.id,
        url: attachmentUrl,
        filename: filename,
        originalName: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error processing attachment:', error);
    res.status(500).json({ error: 'Failed to process attachment' });
  }
});

// Upload camera photo (base64)
router.post('/camera', async (req, res) => {
  const { image, taskId, uploadedBy } = req.body;
  
  if (!image) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    // Extract base64 data
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image data format' });
    }
    
    const imageType = matches[1];
    const imageData = Buffer.from(matches[2], 'base64');
    
    const filename = `camera_${uuidv4()}.jpg`;
    const uploadDir = path.join(__dirname, '../../uploads/camera');
    const filepath = path.join(uploadDir, filename);
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Process and save image
    await sharp(imageData)
      .resize(1920, 1080, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 })
      .toFile(filepath);
    
    const imageUrl = `/uploads/camera/${filename}`;
    
    // If taskId provided, save as task attachment
    if (taskId) {
      const result = await runQuery(
        `INSERT INTO task_attachments (task_id, filename, original_name, url, type, size, uploaded_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [taskId, filename, 'Camera Photo', imageUrl, 'image/jpeg', imageData.length, uploadedBy || null]
      );
      
      res.json({ 
        success: true,
        attachment: {
          id: result.id,
          url: imageUrl,
          filename: filename,
          type: 'image/jpeg'
        }
      });
    } else {
      res.json({ 
        success: true,
        url: imageUrl,
        filename: filename
      });
    }
  } catch (error) {
    console.error('Error processing camera image:', error);
    res.status(500).json({ error: 'Failed to process camera image' });
  }
});

// Delete attachment
router.delete('/attachment/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get attachment info
    const attachment = await getOne(
      'SELECT * FROM task_attachments WHERE id = ?',
      [id]
    );
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    // Delete file
    const filepath = path.join(__dirname, '../..', attachment.url);
    try {
      await fs.unlink(filepath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
    
    // Delete from database
    await runQuery('DELETE FROM task_attachments WHERE id = ?', [id]);
    
    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

export default router;