import express from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';
import { emitUpdate } from '../utils/socketEmitter.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Get all people
router.get('/', async (req, res) => {
  try {
    const { include_deleted } = req.query;
    
    let query = 'SELECT * FROM people';
    
    // By default, exclude deleted people unless specifically requested
    if (include_deleted !== 'true') {
      query += ' WHERE (deleted = 0 OR deleted IS NULL)';
    }
    
    query += ' ORDER BY created_at ASC';
    
    const people = await getAll(query);
    res.json(people);
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({ error: 'Failed to fetch people' });
  }
});

// Get single person by ID
router.get('/:id', async (req, res) => {
  try {
    const person = await getOne('SELECT * FROM people WHERE id = ?', [req.params.id]);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({ error: 'Failed to fetch person' });
  }
});

// Create new person
router.post('/', async (req, res) => {
  const { name, email, photo_url, color } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const result = await runQuery(
      'INSERT INTO people (name, email, photo_url, color) VALUES (?, ?, ?, ?)',
      [name, email || null, photo_url || null, color || '#6B7280']
    );
    
    const newPerson = await getOne('SELECT * FROM people WHERE id = ?', [result.id]);
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'person-created', newPerson);
    
    res.status(201).json(newPerson);
  } catch (error) {
    console.error('Error creating person:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

// Update person
router.put('/:id', async (req, res) => {
  const { name, email, photo_url, color } = req.body;
  
  try {
    const existing = await getOne('SELECT * FROM people WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Person not found' });
    }

    await runQuery(
      `UPDATE people 
       SET name = ?,
           email = ?,
           photo_url = ?,
           color = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name !== undefined ? name : existing.name,
        email !== undefined ? email : existing.email,
        photo_url !== undefined ? photo_url : existing.photo_url,
        color !== undefined ? color : existing.color,
        req.params.id
      ]
    );
    
    const updatedPerson = await getOne('SELECT * FROM people WHERE id = ?', [req.params.id]);
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'person-updated', updatedPerson);
    
    res.json(updatedPerson);
  } catch (error) {
    console.error('Error updating person:', error);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

// Delete person
router.delete('/:id', async (req, res) => {
  try {
    const existing = await getOne('SELECT * FROM people WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Person not found' });
    }

    // Clean up person's photo if it exists
    if (existing.photo_url) {
      try {
        const filename = existing.photo_url.split('/').pop();
        const filepath = path.join(__dirname, '../../uploads', filename);
        await fs.unlink(filepath);
      } catch (err) {
        // Log but don't fail if image deletion fails
        console.error('Failed to delete person photo:', err);
      }
    }

    // Soft delete person - mark as deleted instead of removing from database
    await runQuery(
      `UPDATE people 
       SET deleted = 1, 
           deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'person-deleted', { id: req.params.id });
    
    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

export default router;