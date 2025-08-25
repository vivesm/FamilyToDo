import express from 'express';
import { getAll, getOne, runQuery, runInTransaction } from '../db/database.js';
import { emitUpdate } from '../utils/socketEmitter.js';
import { isValidPriority, isValidRecurringPattern } from '../utils/validation.js';
import { toUTCString } from '../utils/dateUtils.js';
import { 
  createNextRecurringTask, 
  shouldEndRecurrence,
  parseRecurringSettings 
} from '../utils/recurringTasks.js';

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
      LEFT JOIN categories c ON t.category_id = c.id AND (c.deleted = 0 OR c.deleted IS NULL)
      LEFT JOIN task_assignments ta ON t.id = ta.task_id
      LEFT JOIN people p ON ta.person_id = p.id AND (p.deleted = 0 OR p.deleted IS NULL)
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
      LEFT JOIN categories c ON t.category_id = c.id AND (c.deleted = 0 OR c.deleted IS NULL)
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
      WHERE ta.task_id = ? AND (p.deleted = 0 OR p.deleted IS NULL)
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
    recurring_settings,
    assigned_people 
  } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Validate priority
  if (priority && !isValidPriority(priority)) {
    return res.status(400).json({ error: 'Invalid priority value. Must be 1, 2, or 3' });
  }

  // Validate recurring pattern (legacy support)
  if (recurring_pattern && !isValidRecurringPattern(recurring_pattern)) {
    return res.status(400).json({ error: 'Invalid recurring pattern. Must be daily, weekly, or monthly' });
  }

  // Parse enhanced recurring settings
  const recurringData = recurring_settings 
    ? parseRecurringSettings(recurring_settings)
    : {
        recurring_pattern: recurring_pattern || null,
        recurring_interval: null,
        recurring_unit: null,
        recurring_days: null,
        recurring_from: null,
        recurring_end_date: null,
        recurring_end_count: null,
        recurring_copy_attachments: false
      };

  try {
    // Use transaction for task creation with assignments
    const newTaskId = await runInTransaction(async () => {
      // Insert task with enhanced recurring fields
      const result = await runQuery(
        `INSERT INTO tasks (
          title, description, category_id, priority, due_date, 
          recurring_pattern, recurring_interval, recurring_unit, recurring_days, 
          recurring_from, recurring_end_date, recurring_end_count, 
          recurring_copy_attachments
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title, 
          description || null, 
          category_id || null, 
          priority || 3, 
          toUTCString(due_date),
          recurringData.recurring_pattern,
          recurringData.recurring_interval,
          recurringData.recurring_unit,
          recurringData.recurring_days,
          recurringData.recurring_from,
          recurringData.recurring_end_date,
          recurringData.recurring_end_count,
          recurringData.recurring_copy_attachments
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
      LEFT JOIN categories c ON t.category_id = c.id AND (c.deleted = 0 OR c.deleted IS NULL)
      WHERE t.id = ?
    `, [newTaskId]);
    
    // Get assigned people
    const people = await getAll(`
      SELECT p.* 
      FROM people p
      JOIN task_assignments ta ON p.id = ta.person_id
      WHERE ta.task_id = ? AND (p.deleted = 0 OR p.deleted IS NULL)
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
    recurring_settings,
    assigned_people 
  } = req.body;
  
  try {
    const existing = await getOne('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Parse enhanced recurring settings if provided
    let updateFields = {
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      category_id: category_id !== undefined ? category_id : existing.category_id,
      priority: priority !== undefined ? priority : existing.priority,
      due_date: due_date !== undefined ? due_date : existing.due_date,
      recurring_pattern: recurring_pattern !== undefined ? recurring_pattern : existing.recurring_pattern
    };

    // Handle enhanced recurring settings
    if (recurring_settings !== undefined) {
      const recurringData = parseRecurringSettings(recurring_settings);
      updateFields = {
        ...updateFields,
        recurring_pattern: recurringData.recurring_pattern,
        recurring_interval: recurringData.recurring_interval,
        recurring_unit: recurringData.recurring_unit,
        recurring_days: recurringData.recurring_days,
        recurring_from: recurringData.recurring_from,
        recurring_end_date: recurringData.recurring_end_date,
        recurring_end_count: recurringData.recurring_end_count,
        recurring_copy_attachments: recurringData.recurring_copy_attachments
      };
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
           recurring_interval = ?,
           recurring_unit = ?,
           recurring_days = ?,
           recurring_from = ?,
           recurring_end_date = ?,
           recurring_end_count = ?,
           recurring_copy_attachments = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        updateFields.title,
        updateFields.description,
        updateFields.category_id,
        updateFields.priority,
        updateFields.due_date,
        updateFields.recurring_pattern,
        updateFields.recurring_interval || existing.recurring_interval,
        updateFields.recurring_unit || existing.recurring_unit,
        updateFields.recurring_days || existing.recurring_days,
        updateFields.recurring_from || existing.recurring_from,
        updateFields.recurring_end_date || existing.recurring_end_date,
        updateFields.recurring_end_count || existing.recurring_end_count,
        updateFields.recurring_copy_attachments !== undefined ? updateFields.recurring_copy_attachments : existing.recurring_copy_attachments,
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
      LEFT JOIN categories c ON t.category_id = c.id AND (c.deleted = 0 OR c.deleted IS NULL)
      WHERE t.id = ?
    `, [req.params.id]);
    
    // Get assigned people
    const people = await getAll(`
      SELECT p.* 
      FROM people p
      JOIN task_assignments ta ON p.id = ta.person_id
      WHERE ta.task_id = ? AND (p.deleted = 0 OR p.deleted IS NULL)
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
    
    // Handle recurring tasks with enhanced logic
    if (existing.recurring_pattern || existing.recurring_unit) {
      // Check if recurrence should end
      if (!shouldEndRecurrence(existing)) {
        const nextTaskData = createNextRecurringTask(existing);
        
        if (nextTaskData) {
          // Use transaction for atomic creation
          const newTaskId = await runInTransaction(async () => {
            const result = await runQuery(
              `INSERT INTO tasks (
                title, description, category_id, priority, due_date, 
                recurring_pattern, recurring_interval, recurring_unit, recurring_days, 
                recurring_from, recurring_end_date, recurring_end_count, 
                recurring_occurrence, recurring_group_id, parent_task_id, 
                recurring_copy_attachments
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                nextTaskData.title,
                nextTaskData.description,
                nextTaskData.category_id,
                nextTaskData.priority,
                nextTaskData.due_date,
                nextTaskData.recurring_pattern,
                nextTaskData.recurring_interval,
                nextTaskData.recurring_unit,
                nextTaskData.recurring_days,
                nextTaskData.recurring_from,
                nextTaskData.recurring_end_date,
                nextTaskData.recurring_end_count,
                nextTaskData.recurring_occurrence,
                nextTaskData.recurring_group_id,
                nextTaskData.parent_task_id,
                nextTaskData.recurring_copy_attachments
              ]
            );
            
            return result.id;
          });
          
          // Copy assignments to new task
          const assignments = await getAll(
            'SELECT person_id FROM task_assignments WHERE task_id = ?',
            [req.params.id]
          );
          
          for (const assignment of assignments) {
            await runQuery(
              'INSERT INTO task_assignments (task_id, person_id) VALUES (?, ?)',
              [newTaskId, assignment.person_id]
            );
          }
          
          // Copy attachments if specified
          if (nextTaskData.recurring_copy_attachments) {
            const attachments = await getAll(
              'SELECT filename, original_name, file_size, mime_type FROM task_attachments WHERE task_id = ?',
              [req.params.id]
            );
            
            for (const attachment of attachments) {
              await runQuery(
                `INSERT INTO task_attachments (task_id, filename, original_name, file_size, mime_type, uploaded_at) 
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [newTaskId, attachment.filename, attachment.original_name, attachment.file_size, attachment.mime_type]
              );
            }
          }
          
          // Emit new task creation
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
          
          // Get assigned people for the new task
          const newTaskPeople = await getAll(`
            SELECT p.* 
            FROM people p
            JOIN task_assignments ta ON p.id = ta.person_id
            WHERE ta.task_id = ?
          `, [newTaskId]);
          
          newTask.assigned_people = newTaskPeople;
          emitUpdate(req.app.get('io'), 'task-created', newTask);
        }
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
    if (existing.recurring_pattern || existing.recurring_unit) {
      // Check if recurrence should end
      if (!shouldEndRecurrence(existing)) {
        const nextTaskData = createNextRecurringTask(existing);
        
        if (nextTaskData) {
          // Use transaction for atomic creation
          const newTaskId = await runInTransaction(async () => {
            const result = await runQuery(
              `INSERT INTO tasks (
                title, description, category_id, priority, due_date, 
                recurring_pattern, recurring_interval, recurring_unit, recurring_days, 
                recurring_from, recurring_end_date, recurring_end_count, 
                recurring_occurrence, recurring_group_id, parent_task_id, 
                recurring_copy_attachments
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                nextTaskData.title,
                nextTaskData.description,
                nextTaskData.category_id,
                nextTaskData.priority,
                nextTaskData.due_date,
                nextTaskData.recurring_pattern,
                nextTaskData.recurring_interval,
                nextTaskData.recurring_unit,
                nextTaskData.recurring_days,
                nextTaskData.recurring_from,
                nextTaskData.recurring_end_date,
                nextTaskData.recurring_end_count,
                nextTaskData.recurring_occurrence,
                nextTaskData.recurring_group_id,
                nextTaskData.parent_task_id,
                nextTaskData.recurring_copy_attachments
              ]
            );
            
            return result.id;
          });
          
          // Copy assignments to new task
          const assignments = await getAll(
            'SELECT person_id FROM task_assignments WHERE task_id = ?',
            [req.params.id]
          );
          
          for (const assignment of assignments) {
            await runQuery(
              'INSERT INTO task_assignments (task_id, person_id) VALUES (?, ?)',
              [newTaskId, assignment.person_id]
            );
          }
          
          // Copy attachments if specified
          if (nextTaskData.recurring_copy_attachments) {
            const attachments = await getAll(
              'SELECT filename, original_name, file_size, mime_type FROM task_attachments WHERE task_id = ?',
              [req.params.id]
            );
            
            for (const attachment of attachments) {
              await runQuery(
                `INSERT INTO task_attachments (task_id, filename, original_name, file_size, mime_type, uploaded_at) 
                 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [newTaskId, attachment.filename, attachment.original_name, attachment.file_size, attachment.mime_type]
              );
            }
          }
          
          // Emit the new task creation
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
          
          // Get assigned people for the new task
          const newTaskPeople = await getAll(`
            SELECT p.* 
            FROM people p
            JOIN task_assignments ta ON p.id = ta.person_id
            WHERE ta.task_id = ?
          `, [newTaskId]);
          
          newTask.assigned_people = newTaskPeople;
          emitUpdate(req.app.get('io'), 'task-created', newTask);
        }
      }
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
      LEFT JOIN categories c ON t.category_id = c.id AND (c.deleted = 0 OR c.deleted IS NULL)
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