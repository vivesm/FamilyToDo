// Date/Time utility functions

/**
 * Convert a date to ISO string format in UTC
 * @param {Date|string} date - Date to convert
 * @returns {string} - ISO string in UTC
 */
export function toUTCString(date) {
  if (!date) return null;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  
  return d.toISOString();
}

/**
 * Parse a date string and return a Date object
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} - Parsed Date object or null if invalid
 */
export function parseDate(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is overdue (past due date)
 * @param {Date|string} dueDate - Due date to check
 * @returns {boolean} - True if overdue
 */
export function isOverdue(dueDate) {
  if (!dueDate) return false;
  
  const due = parseDate(dueDate);
  if (!due) return false;
  
  const now = new Date();
  // Set time to end of day for due date to be more forgiving
  due.setHours(23, 59, 59, 999);
  
  return now > due;
}

/**
 * Calculate the next occurrence date for a recurring task
 * @param {Date|string} currentDate - Current due date
 * @param {string} pattern - Recurring pattern (daily, weekly, monthly)
 * @returns {string|null} - Next occurrence date as ISO string
 */
export function calculateNextOccurrence(currentDate, pattern) {
  if (!currentDate || !pattern) return null;
  
  const date = parseDate(currentDate);
  if (!date) return null;
  
  const nextDate = new Date(date);
  
  switch (pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      // Handle month boundaries correctly
      const currentDay = nextDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + 1);
      
      // If the day changed (e.g., Jan 31 -> Feb 28), set to last day of month
      if (nextDate.getDate() !== currentDay) {
        nextDate.setDate(0); // Sets to last day of previous month
      }
      break;
    default:
      return null;
  }
  
  return toUTCString(nextDate);
}

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} - Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  
  const d = parseDate(date);
  if (!d) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return d.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Get the start of day for a given date
 * @param {Date|string} date - Date to process
 * @returns {Date} - Date at start of day
 */
export function startOfDay(date) {
  const d = date ? parseDate(date) : new Date();
  if (!d) return null;
  
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of day for a given date
 * @param {Date|string} date - Date to process
 * @returns {Date} - Date at end of day
 */
export function endOfDay(date) {
  const d = date ? parseDate(date) : new Date();
  if (!d) return null;
  
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Add days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export function addDays(date, days) {
  const d = parseDate(date);
  if (!d) return null;
  
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get days until due date
 * @param {Date|string} dueDate - Due date
 * @returns {number|null} - Days until due (negative if overdue)
 */
export function daysUntilDue(dueDate) {
  if (!dueDate) return null;
  
  const due = parseDate(dueDate);
  if (!due) return null;
  
  const now = new Date();
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}