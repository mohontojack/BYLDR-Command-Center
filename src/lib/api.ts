/**
 * API Hooks Layer
 *
 * Clean, typed fetch wrappers for all backend API endpoints.
 * Uses native fetch API with consistent error handling and auth token management.
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

// ==================== TOKEN MANAGEMENT ====================

let authToken: string | null = null;

/**
 * Set the auth token for API requests (stored in memory).
 * Called after login. The token is also sent via httpOnly cookie by the server.
 */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/**
 * Get the current auth token.
 */
export function getAuthToken(): string | null {
  return authToken;
}

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
    // Handle 401 - session expired
    if (response.status === 401) {
      // Clear client state and trigger logout
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bldr_user');
        localStorage.removeItem('bldr_token');
        window.location.reload();
      }
    }
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

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // Include Authorization header (server also checks cookie)
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
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
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse<LeadsResponse>(res, 'GET /api/leads');
}

export async function fetchLead(id: string): Promise<Lead> {
  const res = await fetch(`/api/leads/${id}`, { headers: authHeaders() });
  const data = await handleResponse<LeadResponse>(res, `GET /api/leads/${id}`);
  return data.lead;
}

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
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<LeadResponse>(res, 'POST /api/leads');
  return result.lead;
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
  const res = await fetch('/api/leads', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, ...data }),
  });
  const result = await handleResponse<LeadResponse>(res, 'PUT /api/leads');
  return result.lead;
}

export async function archiveLead(id: string): Promise<Lead> {
  const res = await fetch(`/api/leads?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  const result = await handleResponse<LeadResponse>(res, `DELETE /api/leads?id=${id}`);
  return result.lead;
}

// ==================== TASKS ====================

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
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse<TasksResponse>(res, 'GET /api/tasks');
}

export async function fetchTask(id: string): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, { headers: authHeaders() });
  const data = await handleResponse<TaskResponse>(res, `GET /api/tasks/${id}`);
  return data.task;
}

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
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<TaskResponse>(res, 'POST /api/tasks');
  return result.task;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, ...data }),
  });
  const result = await handleResponse<TaskResponse>(res, 'PUT /api/tasks');
  return result.task;
}

// ==================== ACTIVITIES ====================

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
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse<ActivitiesResponse>(res, 'GET /api/activities');
}

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
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<ActivityResponse>(res, 'POST /api/activities');
  return result.activity;
}

// ==================== NOTIFICATIONS ====================

export async function fetchNotifications(
  userId?: string,
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  const url = buildUrl('/api/notifications', { userId });
  const res = await fetch(url, { headers: authHeaders() });
  const data = await handleResponse<NotificationsResponse>(res, 'GET /api/notifications');
  return { notifications: data.notifications, unreadCount: data.unreadCount };
}

export async function markNotificationsRead(ids: string[]): Promise<number> {
  const res = await fetch('/api/notifications', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ ids }),
  });
  const data = await handleResponse<{ updated: number }>(res, 'PUT /api/notifications');
  return data.updated;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const res = await fetch('/api/notifications', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ markAll: true, userId }),
  });
  const data = await handleResponse<{ updated: number }>(res, 'PUT /api/notifications');
  return data.updated;
}

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
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<NotificationResponse>(res, 'POST /api/notifications');
  return result.notification;
}

// ==================== DASHBOARD ====================

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard', { headers: authHeaders() });
  return handleResponse<DashboardData>(res, 'GET /api/dashboard');
}

// ==================== USERS ====================

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users', { headers: authHeaders() });
  const data = await handleResponse<UsersResponse>(res, 'GET /api/users');
  return data.users;
}

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
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const result = await handleResponse<UserResponse>(res, 'POST /api/users');
  return result.user;
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await fetch('/api/users', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, ...data }),
  });
  const result = await handleResponse<UserResponse>(res, 'PUT /api/users');
  return result.user;
}

// ==================== AUTOMATIONS ====================

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
  const res = await fetch(url, { headers: authHeaders() });
  const data = await handleResponse<AutomationsResponse>(res, 'GET /api/automations');
  return data.automations;
}

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
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AutomationResponse>(res, 'POST /api/automations');
}

export async function updateAutomation(
  id: string,
  data: Partial<Automation>,
): Promise<Automation> {
  const res = await fetch('/api/automations', {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ id, ...data }),
  });
  return handleResponse<AutomationResponse>(res, 'PUT /api/automations');
}

export async function toggleAutomation(id: string, enabled: boolean): Promise<Automation> {
  return updateAutomation(id, { enabled });
}

export async function deleteAutomation(id: string): Promise<void> {
  const res = await fetch(`/api/automations?id=${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await handleResponse<{ success: boolean }>(res, `DELETE /api/automations?id=${id}`);
}

// ==================== SEED ====================

export async function seedDatabase(): Promise<SeedResponse> {
  const res = await fetch('/api/seed', {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse<SeedResponse>(res, 'POST /api/seed');
}

// ==================== AUTH ====================

export interface LoginResponse {
  user: User;
  token: string;
  message: string;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse<LoginResponse>(res, 'POST /api/auth');
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth', {
    method: 'DELETE',
  });
}

// ==================== EXPORT ERROR CLASS ====================

export { ApiError };
