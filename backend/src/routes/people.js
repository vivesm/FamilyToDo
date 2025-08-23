import express from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';
import { emitUpdate } from '../utils/socketEmitter.js';

const router = express.Router();

// Get all people
router.get('/', async (req, res) => {
  try {
    const people = await getAll('SELECT * FROM people ORDER BY created_at ASC');
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
       SET name = COALESCE(?, name),
           email = COALESCE(?, email),
           photo_url = COALESCE(?, photo_url),
           color = COALESCE(?, color),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, email, photo_url, color, req.params.id]
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

    await runQuery('DELETE FROM people WHERE id = ?', [req.params.id]);
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'person-deleted', { id: req.params.id });
    
    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

export default router;