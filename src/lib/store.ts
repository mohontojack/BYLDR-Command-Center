import { create } from 'zustand';
import type {
  Lead,
  Task,
  Activity,
  Notification,
  DashboardData,
  User,
  Automation,
  FunnelStage,
  LeadStatus,
  TaskStatus,
  TaskPriority,
} from './types';
import type { AppView } from './types';

interface AppState {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;

  // Selected items
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  // Current user context (simulated — in production would come from auth)
  currentUserId: string;
  setCurrentUserId: (id: string) => void;

  // Filters
  leadStageFilter: FunnelStage | 'ALL';
  setLeadStageFilter: (stage: FunnelStage | 'ALL') => void;
  leadStatusFilter: LeadStatus | 'ALL';
  setLeadStatusFilter: (status: LeadStatus | 'ALL') => void;
  taskStatusFilter: TaskStatus | 'ALL';
  setTaskStatusFilter: (status: TaskStatus | 'ALL') => void;
  taskPriorityFilter: TaskPriority | 'ALL';
  setTaskPriorityFilter: (priority: TaskPriority | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  leadDetailOpen: boolean;
  setLeadDetailOpen: (open: boolean) => void;
  createLeadDialogOpen: boolean;
  setCreateLeadDialogOpen: (open: boolean) => void;
  createTaskDialogOpen: boolean;
  setCreateTaskDialogOpen: (open: boolean) => void;

  // Data (populated from API)
  users: User[];
  setUsers: (users: User[]) => void;
  dashboard: DashboardData | null;
  setDashboard: (data: DashboardData) => void;
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // Selected items
  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  // Current user context
  currentUserId: '',
  setCurrentUserId: (id) => set({ currentUserId: id }),

  // Filters
  leadStageFilter: 'ALL',
  setLeadStageFilter: (stage) => set({ leadStageFilter: stage }),
  leadStatusFilter: 'ALL',
  setLeadStatusFilter: (status) => set({ leadStatusFilter: status }),
  taskStatusFilter: 'ALL',
  setTaskStatusFilter: (status) => set({ taskStatusFilter: status }),
  taskPriorityFilter: 'ALL',
  setTaskPriorityFilter: (priority) => set({ taskPriorityFilter: priority }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // UI state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  leadDetailOpen: false,
  setLeadDetailOpen: (open) => set({ leadDetailOpen: open }),
  createLeadDialogOpen: false,
  setCreateLeadDialogOpen: (open) => set({ createLeadDialogOpen: open }),
  createTaskDialogOpen: false,
  setCreateTaskDialogOpen: (open) => set({ createTaskDialogOpen: open }),

  // Data
  users: [],
  setUsers: (users) => set({ users }),
  dashboard: null,
  setDashboard: (data) => set({ dashboard: data }),
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
}));
