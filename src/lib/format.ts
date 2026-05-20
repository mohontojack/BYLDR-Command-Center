/**
 * Formatting & Utility Functions
 *
 * Pure helper functions for date formatting, string manipulation,
 * and common display transformations used across the application.
 */

import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  differenceInDays,
} from 'date-fns';

// ==================== DATE FORMATTING ====================

/**
 * Format a date string or Date object as "MMM d, yyyy" (e.g., "Jan 15, 2025").
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a date as relative time (e.g., "3 hours ago", "in 2 days").
 * Falls back to a formatted date for distances > 7 days.
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diff = Math.abs(d.getTime() - now.getTime());
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  if (diff > sevenDays) {
    return formatDate(d);
  }

  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a date with time as "MMM d, yyyy h:mm a" (e.g., "Jan 15, 2025 3:45 PM").
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

/**
 * Format a date with short time as "MMM d, h:mm a" (e.g., "Jan 15, 3:45 PM").
 */
export function formatDateTimeShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, h:mm a');
}

/**
 * Check if a date is in the past (overdue). Ignores time component.
 */
export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
}

/**
 * Check if a date is today.
 */
export function isDueToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}

/**
 * Check if a date is tomorrow.
 */
export function isDueTomorrow(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isTomorrow(d);
}

/**
 * Get the number of days since a lead entered the funnel.
 * Returns 0 if the date is invalid or in the future.
 */
export function getDaysInFunnel(enteredAt: string | Date): number {
  const d = typeof enteredAt === 'string' ? parseISO(enteredAt) : enteredAt;
  const days = differenceInDays(new Date(), d);
  return Math.max(0, days);
}

/**
 * Format a date range as "MMM d – MMM d, yyyy" (e.g., "Jan 15 – Jan 20, 2025").
 */
export function formatDateRange(start: string | Date, end: string | Date): string {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return `${format(s, 'MMM d')} – ${format(e, 'MMM d, yyyy')}`;
}

// ==================== STRING FORMATTING ====================

/**
 * Get initials from a full name (e.g., "John Doe" → "JD").
 * Handles single names, hyphenated names, and edge cases.
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format a phone number for display (US format).
 * Handles various input formats: "1234567890", "123-456-7890", "(123) 456-7890".
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  // Return cleaned digits for non-US numbers
  return phone;
}

/**
 * Truncate a string to a maximum length, adding an ellipsis if truncated.
 */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert a snake_case or SCREAMING_CASE string to Title Case.
 * (e.g., "TASK_CREATED" → "Task Created", "in_progress" → "In Progress")
 */
export function titleCase(str: string): string {
  return str
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format a number as a compact string (e.g., 1200 → "1.2K", 35000 → "35K").
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(num);
}

/**
 * Format a percentage with optional decimal places.
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  if (decimals === 0) {
    return `${Math.round(value)}%`;
  }
  return `${value.toFixed(decimals)}%`;
}

// ==================== DISPLAY HELPERS ====================

/**
 * Get a human-friendly label for a funnel stage.
 */
export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    AWARENESS: 'Awareness',
    DISCOVERY: 'Discovery',
    EVALUATION: 'Evaluation',
    ASSESSMENT: 'Assessment',
    PURCHASE: 'Purchase',
    LOYALTY: 'Loyalty',
  };
  return labels[stage] || titleCase(stage);
}

/**
 * Get a human-friendly label for a task status.
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    ACTIVE: 'Active',
    WON: 'Won',
    LOST: 'Lost',
    ARCHIVED: 'Archived',
  };
  return labels[status] || titleCase(status);
}

/**
 * Get a human-friendly label for a task priority.
 */
export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
  };
  return labels[priority] || titleCase(priority);
}

/**
 * Get a CSS-friendly color class name for a priority.
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'text-slate-500',
    MEDIUM: 'text-blue-600',
    HIGH: 'text-orange-600',
    URGENT: 'text-red-600',
  };
  return colors[priority] || 'text-slate-500';
}

/**
 * Get a CSS-friendly background class for a priority badge.
 */
export function getPriorityBg(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-blue-50 text-blue-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700',
  };
  return colors[priority] || 'bg-slate-100 text-slate-700';
}

/**
 * Get a CSS-friendly background class for a status badge.
 */
export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    CANCELLED: 'bg-red-50 text-red-700',
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    WON: 'bg-green-50 text-green-700',
    LOST: 'bg-red-50 text-red-700',
    ARCHIVED: 'bg-slate-100 text-slate-500',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
}

/**
 * Get a full name from first and last name parts.
 */
export function getFullName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.join(' ') || 'Unknown';
}
