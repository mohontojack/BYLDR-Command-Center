import type { FunnelStage } from './types';

// ==================== Funnel Stages ====================

export const FUNNEL_STAGES = [
  {
    key: 'AWARENESS' as FunnelStage,
    label: 'Awareness',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
    order: 1,
  },
  {
    key: 'DISCOVERY' as FunnelStage,
    label: 'Discovery',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50 text-purple-700 border-purple-200',
    order: 2,
  },
  {
    key: 'EVALUATION' as FunnelStage,
    label: 'Evaluation',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 text-amber-700 border-amber-200',
    order: 3,
  },
  {
    key: 'ASSESSMENT' as FunnelStage,
    label: 'Assessment',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50 text-orange-700 border-orange-200',
    order: 4,
  },
  {
    key: 'PURCHASE' as FunnelStage,
    label: 'Purchase',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    order: 5,
  },
  {
    key: 'LOYALTY' as FunnelStage,
    label: 'Loyalty',
    color: 'bg-teal-500',
    lightColor: 'bg-teal-50 text-teal-700 border-teal-200',
    order: 6,
  },
];

// ==================== Priority Configuration ====================

export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
} as const;

// ==================== Task Status Configuration ====================

export const TASK_STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'bg-slate-100 text-slate-700', icon: 'Circle' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-700', icon: 'Clock' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: 'CheckCircle' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: 'XCircle' },
} as const;

// ==================== Activity Icons (Lucide icon names) ====================

export const ACTIVITY_ICONS: Record<string, string> = {
  LEAD_CREATED: 'UserPlus',
  STAGE_CHANGED: 'ArrowRight',
  EMAIL_SENT: 'Mail',
  EMAIL_OPENED: 'MailOpen',
  EMAIL_REPLIED: 'MailCheck',
  SMS_SENT: 'MessageSquare',
  SMS_REPLIED: 'MessageCircle',
  CALL_MADE: 'Phone',
  CALL_COMPLETED: 'PhoneCall',
  LINK_CLICKED: 'MousePointerClick',
  FORM_SUBMITTED: 'FileText',
  VIDEO_VIEWED: 'Video',
  NOTE_ADDED: 'StickyNote',
  TASK_CREATED: 'ListPlus',
  TASK_COMPLETED: 'CheckSquare',
  TASK_ASSIGNED: 'UserCheck',
  AUTOMATION_TRIGGERED: 'Zap',
  FUNNEL_DAY_ADVANCED: 'CalendarClock',
};

// ==================== Role Labels ====================

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  CSO: 'CSO (Chief Sales Officer)',
  TECH_LEAD: 'Tech Lead',
  CONTRACTOR: 'Contractor',
};

// ==================== Lead Source Options ====================

export const SOURCE_OPTIONS = [
  'NXL BYLDR',
  'CA BYLDRS',
  'BYLDRS GUARDIAN',
  'REFERRAL',
  'ORGANIC',
  'OTHER',
] as const;

// ==================== Task Types ====================

export const TASK_TYPES = [
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Send Email' },
  { value: 'research', label: 'Research' },
  { value: 'admin', label: 'Administrative' },
  { value: 'automation', label: 'Automation' },
] as const;

// ==================== Automation Trigger Labels ====================

export const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: 'New Lead Created',
  STAGE_CHANGED: 'Funnel Stage Changed',
  EMAIL_OPENED: 'Email Opened',
  EMAIL_REPLIED: 'Email Replied',
  LINK_CLICKED: 'Link Clicked',
  SMS_REPLIED: 'SMS Replied',
  CALL_COMPLETED: 'Call Completed',
  FORM_SUBMITTED: 'Form Submitted',
  DAYS_IN_FUNNEL: 'Specific Day in Funnel',
  TASK_OVERDUE: 'Task Overdue',
  LEAD_INACTIVE: 'Lead Inactive (Days)',
};
