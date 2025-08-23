import express from 'express';
import { getAll, getOne, runQuery } from '../db/database.js';
import { emitUpdate } from '../utils/socketEmitter.js';
import { isEmoji, isValidHexColor } from '../utils/validation.js';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await getAll(
      'SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const category = await getOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create new category
router.post('/', async (req, res) => {
  const { name, icon, color, sort_order } = req.body;
  
  if (!name || !icon) {
    return res.status(400).json({ error: 'Name and icon are required' });
  }

  // Validate icon is an emoji
  if (!isEmoji(icon)) {
    return res.status(400).json({ error: 'Icon must be a valid emoji' });
  }

  // Validate color format if provided
  if (color && !isValidHexColor(color)) {
    return res.status(400).json({ error: 'Color must be a valid hex color (e.g., #FF0000)' });
  }

  try {
    const result = await runQuery(
      'INSERT INTO categories (name, icon, color, sort_order) VALUES (?, ?, ?, ?)',
      [name, icon, color || '#6B7280', sort_order || 999]
    );
    
    const newCategory = await getOne('SELECT * FROM categories WHERE id = ?', [result.id]);
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'category-created', newCategory);
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  const { name, icon, color, sort_order } = req.body;
  
  // Validate icon if provided
  if (icon !== undefined && !isEmoji(icon)) {
    return res.status(400).json({ error: 'Icon must be a valid emoji' });
  }

  // Validate color if provided
  if (color !== undefined && color && !isValidHexColor(color)) {
    return res.status(400).json({ error: 'Color must be a valid hex color (e.g., #FF0000)' });
  }
  
  try {
    const existing = await getOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await runQuery(
      `UPDATE categories 
       SET name = ?,
           icon = ?,
           color = ?,
           sort_order = ?
       WHERE id = ?`,
      [
        name !== undefined ? name : existing.name,
        icon !== undefined ? icon : existing.icon,
        color !== undefined ? color : existing.color,
        sort_order !== undefined ? sort_order : existing.sort_order,
        req.params.id
      ]
    );
    
    const updatedCategory = await getOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'category-updated', updatedCategory);
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const existing = await getOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if it's a default category
    const defaultCategories = ['Shopping', 'Home', 'Homework', 'Activities', 'Health', 'Fun'];
    if (defaultCategories.includes(existing.name)) {
      return res.status(400).json({ error: 'Cannot delete default categories' });
    }

    await runQuery('DELETE FROM categories WHERE id = ?', [req.params.id]);
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'category-deleted', { id: req.params.id });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;