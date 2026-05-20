/**
 * API Hooks Layer
 *
 * Clean, typed fetch wrappers for all backend API endpoints.
 * Uses native fetch API with consistent error handling.
 */

import type {
  Lead,
  Task,
  Activity,
  Notification,
  User,
  Automation,
  DashboardData,
  FunnelStage,
  LeadStatus,
  TaskStatus,
  TaskPriority,
  LeadsResponse,
  LeadResponse,
  TasksResponse,
  TaskResponse,
  ActivitiesResponse,
  ActivityResponse,
  NotificationsResponse,
  NotificationResponse,
  UsersResponse,
  UserResponse,
  AutomationsResponse,
  AutomationResponse,
  SeedResponse,
} from '@/lib/types';

// ==================== ERROR HANDLING ====================

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response, endpoint: string): Promise<T> {
  if (!response.ok) {
    let message = `API error at ${endpoint}: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch {
      // response body is not JSON — keep the default message
    }
    throw new ApiError(response.status, message);
  }
  return response.json() as Promise<T>;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return path;
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `${path}?${qs}` : path;
}

// ==================== LEADS ====================

/**
 * Fetch leads with optional filtering and sorting.
 * Maps to: GET /api/leads
 */
export async function fetchLeads(
  params?: {
    stage?: FunnelStage | 'ALL';
    status?: LeadStatus | 'ALL';
    assignedTo?: string;
    search?: string;
    sort?: string;
    order?: string;
    page?: number;
    limit?: number;
  },
): Promise<LeadsResponse> {
  const url = buildUrl('/api/leads', {
    stage: params?.stage && params.stage !== 'ALL' ? params.stage : undefined,
    status: params?.status && params.status !== 'ALL' ? params.status : undefined,
    assignedTo: params?.assignedTo,
    search: params?.search,
    sort: params?.sort,
    order: params?.order,
    page: params?.page,
    limit: params?.limit,
  });
  const res = await fetch(url);
  return handleResponse<LeadsResponse>(res, 'GET /api/leads');
}

/**
 * Fetch a single lead by ID with activities, tasks, and notifications.
 * Maps to: GET /api/leads/[id]
 */
export async function fetchLead(id: string): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`);
  const data = await handleResponse<LeadResponse>(res, `GET /api/leads/${id}`);
  return data.lead;
}

/**
 * Create a new lead.
 * Maps to: POST /api/leads
 */
export async function createLead(
  data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    assignedToId?: string;
    notes?: string;
  },
): Promise<Lead> {
  const res = await fetch('/api/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<LeadResponse>(res, 'POST /api/leads');
  return result.lead;
}

/**
 * Update an existing lead. Requires `id` in the data.
 * Maps to: PUT /api/leads
 */
export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const res = await fetch('/api/leads', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  const result = await handleResponse<LeadResponse>(res, 'PUT /api/leads');
  return result.lead;
}

/**
 * Archive a lead (sets status to ARCHIVED).
 * Maps to: DELETE /api/leads?id=<id>
 */
export async function archiveLead(id: string): Promise<Lead> {
  const res = await fetch(`/api/leads?id=${id}`, {
    method: 'DELETE',
  });
  const result = await handleResponse<LeadResponse>(res, `DELETE /api/leads?id=${id}`);
  return result.lead;
}

// ==================== TASKS ====================

/**
 * Fetch tasks with optional filtering.
 * Maps to: GET /api/tasks
 */
export async function fetchTasks(
  params?: {
    status?: TaskStatus | 'ALL';
    priority?: TaskPriority | 'ALL';
    assignedTo?: string;
    type?: string;
    page?: number;
    limit?: number;
    includeCompleted?: boolean;
  },
): Promise<TasksResponse> {
  const url = buildUrl('/api/tasks', {
    status: params?.status && params.status !== 'ALL' ? params.status : undefined,
    priority: params?.priority && params.priority !== 'ALL' ? params.priority : undefined,
    assignedTo: params?.assignedTo,
    type: params?.type,
    page: params?.page,
    limit: params?.limit,
    includeCompleted: params?.includeCompleted,
  });
  const res = await fetch(url);
  return handleResponse<TasksResponse>(res, 'GET /api/tasks');
}

/**
 * Fetch a single task by ID with activities and related data.
 * Maps to: GET /api/tasks/[id]
 */
export async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`);
  const data = await handleResponse<TaskResponse>(res, `GET /api/tasks/${id}`);
  return data.task;
}

/**
 * Create a new task.
 * Maps to: POST /api/tasks
 */
export async function createTask(
  data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    assignedToId?: string;
    leadId?: string;
    dueDate?: string;
    type?: string;
  },
): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<TaskResponse>(res, 'POST /api/tasks');
  return result.task;
}

/**
 * Update an existing task. Requires `id` in the data.
 * Maps to: PUT /api/tasks
 */
export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  const result = await handleResponse<TaskResponse>(res, 'PUT /api/tasks');
  return result.task;
}

// ==================== ACTIVITIES ====================

/**
 * Fetch activities with optional filtering and pagination.
 * Maps to: GET /api/activities
 */
export async function fetchActivities(
  params?: {
    leadId?: string;
    userId?: string;
    type?: string;
    limit?: number;
    offset?: number;
    page?: number;
  },
): Promise<ActivitiesResponse> {
  const url = buildUrl('/api/activities', {
    leadId: params?.leadId,
    userId: params?.userId,
    type: params?.type,
    limit: params?.limit,
    page: params?.offset !== undefined ? Math.ceil((params.offset + 1) / (params.limit || 50)) : params?.page,
  });
  const res = await fetch(url);
  return handleResponse<ActivitiesResponse>(res, 'GET /api/activities');
}

/**
 * Create a new activity log entry.
 * Maps to: POST /api/activities
 */
export async function createActivity(
  data: {
    type: string;
    description: string;
    leadId?: string;
    userId?: string;
    taskId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<Activity> {
  const res = await fetch('/api/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<ActivityResponse>(res, 'POST /api/activities');
  return result.activity;
}

// ==================== NOTIFICATIONS ====================

/**
 * Fetch notifications for a user with unread count.
 * Maps to: GET /api/notifications
 */
export async function fetchNotifications(
  userId?: string,
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const url = buildUrl('/api/notifications', { userId });
  const res = await fetch(url);
  const data = await handleResponse<NotificationsResponse>(res, 'GET /api/notifications');
  return { notifications: data.notifications, unreadCount: data.unreadCount };
}

/**
 * Mark notifications as read by their IDs.
 * Maps to: PUT /api/notifications  { ids: [...] }
 */
export async function markNotificationsRead(ids: string[]): Promise<number> {
  const res = await fetch('/api/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  const data = await handleResponse<{ updated: number }>(res, 'PUT /api/notifications');
  return data.updated;
}

/**
 * Mark all notifications as read for a given user.
 * Maps to: PUT /api/notifications  { markAll: true, userId }
 */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  const res = await fetch('/api/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAll: true, userId }),
  });
  const data = await handleResponse<{ updated: number }>(res, 'PUT /api/notifications');
  return data.updated;
}

/**
 * Create a new notification.
 * Maps to: POST /api/notifications
 */
export async function createNotification(
  data: {
    type: string;
    title: string;
    message: string;
    userId?: string;
    leadId?: string;
    actionUrl?: string;
  },
): Promise<Notification> {
  const res = await fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<NotificationResponse>(res, 'POST /api/notifications');
  return result.notification;
}

// ==================== DASHBOARD ====================

/**
 * Fetch aggregated dashboard data.
 * Maps to: GET /api/dashboard
 */
export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard');
  return handleResponse<DashboardData>(res, 'GET /api/dashboard');
}

// ==================== USERS ====================

/**
 * Fetch all users.
 * Maps to: GET /api/users
 */
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  const data = await handleResponse<UsersResponse>(res, 'GET /api/users');
  return data.users;
}

/**
 * Create a new user.
 * Maps to: POST /api/users
 */
export async function createUser(
  data: {
    name: string;
    email: string;
    role?: string;
    phone?: string;
    avatar?: string;
  },
): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await handleResponse<UserResponse>(res, 'POST /api/users');
  return result.user;
}

/**
 * Update an existing user. Requires `id` in the data.
 * Maps to: PUT /api/users
 */
export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  const result = await handleResponse<UserResponse>(res, 'PUT /api/users');
  return result.user;
}

// ==================== AUTOMATIONS ====================

/**
 * Fetch all automations.
 * Maps to: GET /api/automations
 */
export async function fetchAutomations(
  params?: {
    enabledOnly?: boolean;
    triggerType?: string;
  },
): Promise<Automation[]> {
  const url = buildUrl('/api/automations', {
    enabledOnly: params?.enabledOnly,
    triggerType: params?.triggerType,
  });
  const res = await fetch(url);
  const data = await handleResponse<AutomationsResponse>(res, 'GET /api/automations');
  return data.automations;
}

/**
 * Create a new automation.
 * Maps to: POST /api/automations
 */
export async function createAutomation(
  data: {
    name: string;
    description?: string;
    triggerType: string;
    triggerConfig: Record<string, unknown>;
    actions: Record<string, unknown>[];
  },
): Promise<Automation> {
  const res = await fetch('/api/automations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<AutomationResponse>(res, 'POST /api/automations');
}

/**
 * Update an automation (toggle enabled, edit fields).
 * Maps to: PUT /api/automations
 */
export async function updateAutomation(
  id: string,
  data: Partial<Automation>,
): Promise<Automation> {
  const res = await fetch('/api/automations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  });
  return handleResponse<AutomationResponse>(res, 'PUT /api/automations');
}

/**
 * Toggle an automation on/off.
 * Maps to: PUT /api/automations  { id, enabled }
 */
export async function toggleAutomation(id: string, enabled: boolean): Promise<Automation> {
  return updateAutomation(id, { enabled });
}

/**
 * Delete an automation.
 * Maps to: DELETE /api/automations?id=<id>
 */
export async function deleteAutomation(id: string): Promise<void> {
  const res = await fetch(`/api/automations?id=${id}`, {
    method: 'DELETE',
  });
  await handleResponse<{ success: boolean }>(res, `DELETE /api/automations?id=${id}`);
}

// ==================== SEED ====================

/**
 * Reseed the database (clears all data).
 * Maps to: POST /api/seed
 */
export async function seedDatabase(): Promise<SeedResponse> {
  const res = await fetch('/api/seed', {
    method: 'POST',
  });
  return handleResponse<SeedResponse>(res, 'POST /api/seed');
}

// ==================== EXPORT ERROR CLASS ====================

export { ApiError };
