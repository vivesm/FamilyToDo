import { v4 as uuidv4 } from 'uuid';
import { parseDate, toUTCString } from './dateUtils.js';

/**
 * Calculate the next occurrence date based on enhanced recurring settings
 */
export function calculateNextRecurrence(task) {
  if (!task.recurring_pattern && !task.recurring_unit) return null;
  
  const baseDate = task.recurring_from === 'completion' 
    ? new Date() 
    : parseDate(task.due_date);
    
  if (!baseDate) return null;
  
  const nextDate = new Date(baseDate);
  const interval = task.recurring_interval || 1;
  
  // Handle legacy patterns
  if (task.recurring_pattern && !task.recurring_unit) {
    switch (task.recurring_pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    return toUTCString(nextDate);
  }
  
  // Handle new enhanced patterns
  switch (task.recurring_unit) {
    case 'day':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
      
    case 'week':
      if (task.recurring_days) {
        // Specific days of week
        const days = JSON.parse(task.recurring_days);
        const nextOccurrence = getNextWeekdayOccurrence(nextDate, days);
        return toUTCString(nextOccurrence);
      } else {
        // Every X weeks
        nextDate.setDate(nextDate.getDate() + (interval * 7));
      }
      break;
      
    case 'month':
      const currentDay = nextDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + interval);
      
      // Handle month boundaries (e.g., Jan 31 -> Feb 28)
      if (nextDate.getDate() !== currentDay) {
        nextDate.setDate(0); // Last day of previous month
      }
      break;
      
    case 'year':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
      
    case 'weekday':
      // Skip weekends
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      break;
  }
  
  return toUTCString(nextDate);
}

/**
 * Get next occurrence for specific weekdays
 */
function getNextWeekdayOccurrence(fromDate, weekdays) {
  const dayMap = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  };
  
  const targetDays = weekdays.map(d => dayMap[d.toLowerCase()]);
  const nextDate = new Date(fromDate);
  
  // Start from tomorrow
  nextDate.setDate(nextDate.getDate() + 1);
  
  // Find next matching weekday
  while (!targetDays.includes(nextDate.getDay())) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate;
}

/**
 * Check if recurring task should end
 */
export function shouldEndRecurrence(task) {
  // Check end date
  if (task.recurring_end_date) {
    const endDate = parseDate(task.recurring_end_date);
    if (new Date() >= endDate) {
      return true;
    }
  }
  
  // Check occurrence count
  if (task.recurring_end_count && task.recurring_occurrence >= task.recurring_end_count) {
    return true;
  }
  
  return false;
}

/**
 * Create recurring task data for next occurrence
 */
export function createNextRecurringTask(originalTask) {
  const nextDueDate = calculateNextRecurrence(originalTask);
  
  if (!nextDueDate || shouldEndRecurrence(originalTask)) {
    return null;
  }
  
  // Generate or reuse recurring group ID
  const recurringGroupId = originalTask.recurring_group_id || uuidv4();
  
  const newTask = {
    title: originalTask.title,
    description: originalTask.description,
    category_id: originalTask.category_id,
    priority: originalTask.priority,
    due_date: nextDueDate,
    recurring_pattern: originalTask.recurring_pattern,
    recurring_interval: originalTask.recurring_interval,
    recurring_unit: originalTask.recurring_unit,
    recurring_days: originalTask.recurring_days,
    recurring_from: originalTask.recurring_from,
    recurring_end_date: originalTask.recurring_end_date,
    recurring_end_count: originalTask.recurring_end_count,
    recurring_occurrence: (originalTask.recurring_occurrence || 1) + 1,
    recurring_group_id: recurringGroupId,
    parent_task_id: originalTask.parent_task_id || originalTask.id,
    recurring_copy_attachments: originalTask.recurring_copy_attachments
  };
  
  return newTask;
}

/**
 * Parse recurring settings from frontend
 */
export function parseRecurringSettings(settings) {
  if (!settings || settings.type === 'none') {
    return {
      recurring_pattern: null,
      recurring_interval: null,
      recurring_unit: null,
      recurring_days: null,
      recurring_from: null,
      recurring_end_date: null,
      recurring_end_count: null,
      recurring_copy_attachments: false
    };
  }
  
  const parsed = {
    recurring_pattern: null, // Legacy field, kept for compatibility
    recurring_interval: settings.interval || 1,
    recurring_unit: settings.unit,
    recurring_days: settings.days ? JSON.stringify(settings.days) : null,
    recurring_from: settings.from || 'due_date',
    recurring_end_date: settings.endDate || null,
    recurring_end_count: settings.endCount || null,
    recurring_copy_attachments: settings.copyAttachments || false
  };
  
  // Set legacy pattern for simple cases
  if (parsed.recurring_interval === 1) {
    switch (parsed.recurring_unit) {
      case 'day':
        parsed.recurring_pattern = 'daily';
        break;
      case 'week':
        if (!parsed.recurring_days) {
          parsed.recurring_pattern = 'weekly';
        }
        break;
      case 'month':
        parsed.recurring_pattern = 'monthly';
        break;
    }
  }
  
  return parsed;
}

/**
 * Get recurring task summary for display
 */
export function getRecurringSummary(task) {
  if (!task.recurring_pattern && !task.recurring_unit) {
    return null;
  }
  
  // Legacy pattern
  if (task.recurring_pattern && !task.recurring_unit) {
    return task.recurring_pattern;
  }
  
  const interval = task.recurring_interval || 1;
  const unit = task.recurring_unit;
  
  let summary = '';
  
  if (unit === 'weekday') {
    summary = 'Every weekday';
  } else if (unit === 'week' && task.recurring_days) {
    const days = JSON.parse(task.recurring_days);
    summary = `Every ${days.join(', ')}`;
  } else if (interval === 1) {
    summary = `Every ${unit}`;
  } else {
    summary = `Every ${interval} ${unit}s`;
  }
  
  if (task.recurring_from === 'completion') {
    summary += ' (from completion)';
  }
  
  if (task.recurring_end_date) {
    const endDate = new Date(task.recurring_end_date).toLocaleDateString();
    summary += ` until ${endDate}`;
  } else if (task.recurring_end_count) {
    summary += ` (${task.recurring_occurrence || 1}/${task.recurring_end_count})`;
  }
  
  return summary;
}