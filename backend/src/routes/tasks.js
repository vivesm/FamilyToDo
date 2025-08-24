import express from 'express';
import { getAll, getOne, runQuery, runInTransaction } from '../db/database.js';
import { emitUpdate } from '../utils/socketEmitter.js';
import { isValidPriority, isValidRecurringPattern } from '../utils/validation.js';
import { toUTCString, calculateNextOccurrence } from '../utils/dateUtils.js';

const router = express.Router();

// Get all tasks with filters
router.get('/', async (req, res) => {
  try {
    const { person_id, category_id, priority, completed, include_deleted } = req.query;
    
    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(GROUP_CONCAT(
          CASE WHEN p.id IS NOT NULL THEN
            json_object('id', p.id, 'name', p.name, 'photo_url', p.photo_url, 'color', p.color)
          END,
          '|||'
        ), '') as assigned_people,
        (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachment_count,
        (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN people p ON ta.person_id = p.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // By default, exclude deleted tasks unless specifically requested
    if (include_deleted !== 'true') {
      query += ' AND (t.deleted = 0 OR t.deleted IS NULL)';
    }
    
    if (completed !== undefined) {
      query += ' AND t.completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }
    
    if (category_id) {
      query += ' AND t.category_id = ?';
      params.push(category_id);
    }
    
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    
    query += ' GROUP BY t.id ORDER BY t.priority ASC, t.due_date ASC';
    
    let tasks = await getAll(query, params);
    
    // Parse assigned people JSON
    tasks = tasks.map(task => ({
      ...task,
      assigned_people: task.assigned_people && task.assigned_people !== ''
        ? task.assigned_people.split('|||').map(p => {
            try {
              return JSON.parse(p);
            } catch (e) {
              console.error('Failed to parse person JSON:', p, e);
              return null;
            }
          }).filter(Boolean)
        : []
    }));
    
    // Filter by person if specified
    if (person_id) {
      tasks = tasks.filter(task => 
        task.assigned_people.some(p => p.id === parseInt(person_id))
      );
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await getOne(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get assigned people
    const assignedPeople = await getAll(`
      SELECT p.* 
      FROM people p
      JOIN task_assignments ta ON p.id = ta.person_id
      WHERE ta.task_id = ?
    `, [req.params.id]);
    
    task.assigned_people = assignedPeople;
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  const { 
    title, 
    description, 
    category_id, 
    priority, 
    due_date, 
    recurring_pattern,
    assigned_people 
  } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Validate priority
  if (priority && !isValidPriority(priority)) {
    return res.status(400).json({ error: 'Invalid priority value. Must be 1, 2, or 3' });
  }

  // Validate recurring pattern
  if (recurring_pattern && !isValidRecurringPattern(recurring_pattern)) {
    return res.status(400).json({ error: 'Invalid recurring pattern. Must be daily, weekly, or monthly' });
  }

  try {
    // Use transaction for task creation with assignments
    const newTaskId = await runInTransaction(async () => {
      // Insert task
      const result = await runQuery(
        `INSERT INTO tasks (title, description, category_id, priority, due_date, recurring_pattern) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          title, 
          description || null, 
          category_id || null, 
          priority || 3, 
          toUTCString(due_date), 
          recurring_pattern || null
        ]
      );
      
      // Assign people if provided
      if (assigned_people && assigned_people.length > 0) {
        for (const personId of assigned_people) {
          await runQuery(
            'INSERT INTO task_assignments (task_id, person_id) VALUES (?, ?)',
            [result.id, personId]
          );
        }
      }
      
      return result.id;
    });
    
    // Fetch complete task with relationships
    const newTask = await getOne(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [newTaskId]);
    
    // Get assigned people
    const people = await getAll(`
      SELECT p.* 
      FROM people p
      JOIN task_assignments ta ON p.id = ta.person_id
      WHERE ta.task_id = ?
    `, [newTaskId]);
    
    newTask.assigned_people = people;
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'task-created', newTask);
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  const { 
    title, 
    description, 
    category_id, 
    priority, 
    due_date, 
    recurring_pattern,
    assigned_people 
  } = req.body;
  
  try {
    const existing = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    await runQuery(
      `UPDATE tasks 
       SET title = ?,
           description = ?,
           category_id = ?,
           priority = ?,
           due_date = ?,
           recurring_pattern = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        category_id !== undefined ? category_id : existing.category_id,
        priority !== undefined ? priority : existing.priority,
        due_date !== undefined ? due_date : existing.due_date,
        recurring_pattern !== undefined ? recurring_pattern : existing.recurring_pattern,
        req.params.id
      ]
    );
    
    // Update assignments if provided
    if (assigned_people !== undefined) {
      // Remove existing assignments
      await runQuery('DELETE FROM task_assignments WHERE task_id = ?', [req.params.id]);
      
      // Add new assignments
      if (assigned_people.length > 0) {
        for (const personId of assigned_people) {
          await runQuery(
            'INSERT INTO task_assignments (task_id, person_id) VALUES (?, ?)',
            [req.params.id, personId]
          );
        }
      }
    }
    
    // Fetch updated task
    const updatedTask = await getOne(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [req.params.id]);
    
    // Get assigned people
    const people = await getAll(`
      SELECT p.* 
      FROM people p
      JOIN task_assignments ta ON p.id = ta.person_id
      WHERE ta.task_id = ?
    `, [req.params.id]);
    
    updatedTask.assigned_people = people;
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'task-updated', updatedTask);
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Complete task
router.post('/:id/complete', async (req, res) => {
  try {
    const existing = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await runQuery(
      `UPDATE tasks 
       SET completed = 1, 
           completed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );
    
    const updatedTask = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    
    // Handle recurring tasks
    if (existing.recurring_pattern) {
      // Create next occurrence
      const nextDueDate = calculateNextOccurrence(existing.due_date, existing.recurring_pattern);
      
      const result = await runQuery(
        `INSERT INTO tasks (title, description, category_id, priority, due_date, recurring_pattern) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          existing.title,
          existing.description,
          existing.category_id,
          existing.priority,
          nextDueDate,
          existing.recurring_pattern
        ]
      );
      
      // Copy assignments
      const assignments = await getAll(
        'SELECT person_id FROM task_assignments WHERE task_id = ?',
        [req.params.id]
      );
      
      for (const assignment of assignments) {
        await runQuery(
          'INSERT INTO task_assignments (task_id, person_id) VALUES (?, ?)',
          [result.id, assignment.person_id]
        );
      }
    }
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'task-completed', updatedTask);
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Uncomplete task
router.post('/:id/uncomplete', async (req, res) => {
  try {
    const existing = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await runQuery(
      `UPDATE tasks 
       SET completed = 0, 
           completed_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );
    
    const updatedTask = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'task-uncompleted', updatedTask);
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Error uncompleting task:', error);
    res.status(500).json({ error: 'Failed to uncomplete task' });
  }
});

// Delete task (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const existing = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Handle recurring tasks - create next occurrence before deleting
    if (existing.recurring_pattern) {
      const nextDueDate = calculateNextOccurrence(existing.due_date, existing.recurring_pattern);
      
      const result = await runQuery(
        `INSERT INTO tasks (title, description, category_id, priority, due_date, recurring_pattern) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          existing.title,
          existing.description,
          existing.category_id,
          existing.priority,
          nextDueDate,
          existing.recurring_pattern
        ]
      );
      
      // Copy assignments to new task
      const assignments = await getAll(
        'SELECT person_id FROM task_assignments WHERE task_id = ?',
        [req.params.id]
      );
      
      for (const assignment of assignments) {
        await runQuery(
          'INSERT INTO task_assignments (task_id, person_id) VALUES (?, ?)',
          [result.id, assignment.person_id]
        );
      }
      
      // Emit the new task creation
      const newTask = await getOne('SELECT * FROM tasks WHERE id = ?', [result.id]);
      emitUpdate(req.app.get('io'), 'task-created', newTask);
    }

    // Soft delete - mark as deleted instead of removing from database
    await runQuery(
      `UPDATE tasks 
       SET deleted = 1, 
           deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.params.id]
    );
    
    // Emit real-time update
    emitUpdate(req.app.get('io'), 'task-deleted', { id: req.params.id });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task attachments
router.get('/:id/attachments', async (req, res) => {
  const { id } = req.params;
  
  try {
    const attachments = await getAll(`
      SELECT 
        ta.*,
        p.name as uploaded_by_name,
        p.photo_url as uploaded_by_photo
      FROM task_attachments ta
      LEFT JOIN people p ON ta.uploaded_by = p.id
      WHERE ta.task_id = ?
      ORDER BY ta.uploaded_at DESC
    `, [id]);
    
    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Get single task with all details (attachments, comments)
router.get('/:id/details', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get task with basic info
    const task = await getOne(`
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [id]);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Get assigned people
    task.assigned_people = await getAll(`
      SELECT p.* FROM people p
      JOIN task_assignments ta ON p.id = ta.person_id
      WHERE ta.task_id = ?
    `, [id]);
    
    // Get attachments
    task.attachments = await getAll(`
      SELECT 
        ta.*,
        p.name as uploaded_by_name,
        p.photo_url as uploaded_by_photo
      FROM task_attachments ta
      LEFT JOIN people p ON ta.uploaded_by = p.id
      WHERE ta.task_id = ?
      ORDER BY ta.uploaded_at DESC
    `, [id]);
    
    // Get comment count (comments will be loaded separately)
    const commentCount = await getOne(
      'SELECT COUNT(*) as count FROM task_comments WHERE task_id = ?',
      [id]
    );
    task.comment_count = commentCount.count;
    
    res.json(task);
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
});


export default router;