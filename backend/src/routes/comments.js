import express from 'express';
import { runQuery, getOne, getAll } from '../db/database.js';

const router = express.Router();

// Socket.io instance will be set by the main server
let io = null;

export function setSocketIO(socketIO) {
  io = socketIO;
}

function emitTaskUpdate(eventType, data) {
  if (io) {
    io.to('family-room').emit(eventType, data);
  }
}

// Get all comments for a task
router.get('/task/:taskId', async (req, res) => {
  const { taskId } = req.params;
  
  try {
    const comments = await getAll(`
      SELECT 
        tc.*,
        p.name as person_name,
        p.photo_url as person_photo,
        p.color as person_color,
        (SELECT COUNT(*) FROM comment_attachments WHERE comment_id = tc.id) as attachment_count
      FROM task_comments tc
      LEFT JOIN people p ON tc.person_id = p.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at DESC
    `, [taskId]);
    
    // Get attachments for each comment
    for (const comment of comments) {
      if (comment.attachment_count > 0) {
        comment.attachments = await getAll(
          'SELECT * FROM comment_attachments WHERE comment_id = ?',
          [comment.id]
        );
      } else {
        comment.attachments = [];
      }
    }
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to a task
router.post('/task/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { personId, comment } = req.body;
  
  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  
  try {
    const result = await runQuery(
      'INSERT INTO task_comments (task_id, person_id, comment) VALUES (?, ?, ?)',
      [taskId, personId || null, comment]
    );
    
    // Get the created comment with person info
    const newComment = await getOne(`
      SELECT 
        tc.*,
        p.name as person_name,
        p.photo_url as person_photo,
        p.color as person_color
      FROM task_comments tc
      LEFT JOIN people p ON tc.person_id = p.id
      WHERE tc.id = ?
    `, [result.id]);
    
    newComment.attachments = [];
    
    // Emit update via socket
    emitTaskUpdate('task:comment:added', {
      taskId,
      comment: newComment
    });
    
    res.json(newComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update a comment
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  
  if (!comment || !comment.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  
  try {
    // Check if comment exists and get task_id
    const existing = await getOne(
      'SELECT * FROM task_comments WHERE id = ?',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    await runQuery(
      'UPDATE task_comments SET comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [comment, id]
    );
    
    // Get updated comment with person info
    const updatedComment = await getOne(`
      SELECT 
        tc.*,
        p.name as person_name,
        p.photo_url as person_photo,
        p.color as person_color
      FROM task_comments tc
      LEFT JOIN people p ON tc.person_id = p.id
      WHERE tc.id = ?
    `, [id]);
    
    // Get attachments
    updatedComment.attachments = await getAll(
      'SELECT * FROM comment_attachments WHERE comment_id = ?',
      [id]
    );
    
    // Emit update via socket
    emitTaskUpdate('task:comment:updated', {
      taskId: existing.task_id,
      comment: updatedComment
    });
    
    res.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get comment info including attachments
    const comment = await getOne(
      'SELECT * FROM task_comments WHERE id = ?',
      [id]
    );
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Delete comment (attachments will be cascade deleted)
    await runQuery('DELETE FROM task_comments WHERE id = ?', [id]);
    
    // Emit update via socket
    emitTaskUpdate('task:comment:deleted', {
      taskId: comment.task_id,
      commentId: id
    });
    
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;