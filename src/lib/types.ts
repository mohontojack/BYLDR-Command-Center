// ==================== APP TYPES ====================

export type AppView = 'dashboard' | 'pipeline' | 'tasks' | 'leads' | 'notifications' | 'automations' | 'team';

// ==================== ENUM TYPES ====================

export type UserRole = 'ADMIN' | 'CSO' | 'TECH_LEAD' | 'CONTRACTOR';
export type FunnelStage = 'AWARENESS' | 'DISCOVERY' | 'EVALUATION' | 'ASSESSMENT' | 'PURCHASE' | 'LOYALTY';
export type LeadStatus = 'ACTIVE' | 'WON' | 'LOST' | 'ARCHIVED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ActivityType =
  | 'LEAD_CREATED'
  | 'STAGE_CHANGED'
  | 'EMAIL_SENT'
  | 'EMAIL_OPENED'
  | 'EMAIL_REPLIED'
  | 'SMS_SENT'
  | 'SMS_REPLIED'
  | 'CALL_MADE'
  | 'CALL_COMPLETED'
  | 'LINK_CLICKED'
  | 'FORM_SUBMITTED'
  | 'VIDEO_VIEWED'
  | 'NOTE_ADDED'
  | 'TASK_CREATED'
  | 'TASK_COMPLETED'
  | 'TASK_ASSIGNED'
  | 'AUTOMATION_TRIGGERED'
  | 'FUNNEL_DAY_ADVANCED';
export type NotificationType =
  | 'LEAD_ASSIGNED'
  | 'STAGE_CHANGE'
  | 'TASK_DUE'
  | 'TASK_OVERDUE'
  | 'LEAD_ENGAGEMENT'
  | 'AUTOMATION_ALERT'
  | 'DAILY_SUMMARY'
  | 'SYSTEM';
export type TriggerType =
  | 'LEAD_CREATED'
  | 'STAGE_CHANGED'
  | 'EMAIL_OPENED'
  | 'EMAIL_REPLIED'
  | 'LINK_CLICKED'
  | 'SMS_REPLIED'
  | 'CALL_COMPLETED'
  | 'FORM_SUBMITTED'
  | 'DAYS_IN_FUNNEL'
  | 'TASK_OVERDUE'
  | 'LEAD_INACTIVE';

// ==================== INTERFACE TYPES ====================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  phone?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assignedLeads: number;
    assignedTasks: number;
  };
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source: string;
  funnelStage: FunnelStage;
  previousStage?: FunnelStage | null;
  status: LeadStatus;
  dayInFunnel: number;
  score: number;
  tags: string;
  notes?: string | null;
  assignedToId?: string | null;
  createdById?: string | null;
  enteredAwarenessAt: string;
  enteredDiscoveryAt?: string | null;
  enteredEvaluationAt?: string | null;
  enteredAssessmentAt?: string | null;
  enteredPurchaseAt?: string | null;
  enteredLoyaltyAt?: string | null;
  closedAt?: string | null;
  lastEngagementAt?: string | null;
  lastContactAt?: string | null;
  nextActionDate?: string | null;
  nextActionType?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  assignedTo?: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role'> | null;
  createdBy?: Pick<User, 'id' | 'name' | 'email'> | null;
  tasks?: Task[];
  activities?: Activity[];
  notifications?: Notification[];
  _count?: {
    tasks: number;
    activities: number;
    notifications: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: string;
  assignedToId?: string | null;
  createdById?: string | null;
  leadId?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  reminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  assignedTo?: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'role'> | null;
  createdBy?: Pick<User, 'id' | 'name' | 'email'> | null;
  lead?: Pick<Lead, 'id' | 'firstName' | 'lastName' | 'email' | 'company' | 'funnelStage' | 'status'> | null;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  metadata?: string | null;
  leadId?: string | null;
  userId?: string | null;
  taskId?: string | null;
  createdAt: string;
  // Relations
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatar'> | null;
  lead?: Pick<Lead, 'id' | 'firstName' | 'lastName' | 'company'> | null;
  task?: Pick<Task, 'id' | 'title' | 'status'> | null;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  userId?: string | null;
  leadId?: string | null;
  actionUrl?: string | null;
  createdAt: string;
  // Relations
  lead?: Pick<Lead, 'id' | 'firstName' | 'lastName' | 'company'> | null;
  user?: Pick<User, 'id' | 'name' | 'email'> | null;
}

export interface Automation {
  id: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  actions: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}

// ==================== DASHBOARD TYPE ====================

export interface FunnelConversion {
  stage: FunnelStage;
  count: number;
  rate: number | null;
}

export interface DashboardData {
  leads: {
    total: number;
    newToday: number;
    active: number;
    won: number;
    lost: number;
    byStage: Record<FunnelStage, number>;
  };
  tasks: {
    total: number;
    overdue: number;
    completedToday: number;
    byStatus: Record<TaskStatus, number>;
    byPriority: Record<TaskPriority, number>;
  };
  todayActionItems: {
    tasksDueToday: Task[];
    leadsNeedingFollowUp: Lead[];
  };
  recentActivities: Activity[];
  recentNotifications: Notification[];
  funnel: {
    stages: Record<FunnelStage, number>;
    conversions: FunnelConversion[];
    overallConversionRate: number;
  };
  unreadNotifications: number;
}

// ==================== PAGINATION TYPE ====================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==================== API RESPONSE TYPES ====================

export interface LeadsResponse {
  leads: Lead[];
  pagination: Pagination;
}

export interface LeadResponse {
  lead: Lead;
}

export interface TasksResponse {
  tasks: Task[];
  pagination: Pagination;
}

export interface TaskResponse {
  task: Task;
}

export interface ActivitiesResponse {
  activities: Activity[];
  pagination: Pagination;
}

export interface ActivityResponse {
  activity: Activity;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: Pagination;
}

export interface NotificationResponse {
  notification: Notification;
}

export interface UsersResponse {
  users: User[];
}

export interface UserResponse {
  user: User;
}

export interface AutomationsResponse {
  automations: Automation[];
}

export type AutomationResponse = Automation;

export interface SeedResponse {
  success: boolean;
  message: string;
}

// ==================== CONSTANT ARRAYS ====================

export const FUNNEL_STAGES: FunnelStage[] = [
  'AWARENESS',
  'DISCOVERY',
  'EVALUATION',
  'ASSESSMENT',
  'PURCHASE',
  'LOYALTY',
];

export const TASK_STATUSES: TaskStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

export const TASK_PRIORITIES: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

export const LEAD_STATUSES: LeadStatus[] = [
  'ACTIVE',
  'WON',
  'LOST',
  'ARCHIVED',
];

export const USER_ROLES: UserRole[] = [
  'ADMIN',
  'CSO',
  'TECH_LEAD',
  'CONTRACTOR',
];
