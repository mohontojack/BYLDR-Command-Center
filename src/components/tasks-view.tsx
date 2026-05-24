'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchTasks, updateTask, createTask, fetchLeads } from '@/lib/api';
import {
  PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  TASK_TYPES,
} from '@/lib/constants';
import {
  formatRelativeTime,
  getInitials,
  isOverdue,
  isDueToday,
  getPriorityBg,
  getStatusBg,
  getFullName,
  formatDate,
} from '@/lib/format';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  Lead,
} from '@/lib/types';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  CheckSquare,
  ListTodo,
  Calendar,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  CircleDot,
  UserPlus,
} from 'lucide-react';

// ==================== Priority Ordering ====================

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ==================== Task Row Skeleton ====================

function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3 w-3 rounded-full" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-24 ml-auto" />
      <Skeleton className="h-5 w-5 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

// ==================== Empty State ====================

function EmptyTasks({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
        <ListTodo className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        No tasks found
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {status === 'ALL'
          ? 'Create a new task to get started'
          : `No ${status.toLowerCase().replace('_', ' ')} tasks at the moment`}
      </p>
    </div>
  );
}

// ==================== Create Task Dialog ====================

function CreateTaskDialog({
  open,
  onOpenChange,
  onSubmit,
  users,
  leads,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    assignedToId?: string;
    leadId?: string;
    dueDate?: string;
    type?: string;
  }) => void;
  users: { id: string; name: string }[];
  leads: { id: string; label: string }[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('follow_up');
  const [leadSearch, setLeadSearch] = useState('');

  const filteredLeads = useMemo(() => {
    if (!leadSearch) return leads.slice(0, 20);
    const q = leadSearch.toLowerCase();
    return leads.filter((l) => l.label.toLowerCase().includes(q));
  }, [leads, leadSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description: description || undefined,
      priority,
      assignedToId: assignedToId || undefined,
      leadId: leadId || undefined,
      dueDate: dueDate || undefined,
      type: type || undefined,
    });
    // Reset
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setAssignedToId('');
    setLeadId('');
    setDueDate('');
    setType('follow_up');
    setLeadSearch('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taskTitle">Title *</Label>
            <Input
              id="taskTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taskDesc">Description</Label>
            <Textarea
              id="taskDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${config.dot}`}
                        />
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assigned To</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskDue">Due Date</Label>
              <Input
                id="taskDue"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Related Lead</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Search & select a lead" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Search leads..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="h-8 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <Separator />
                {filteredLeads.length === 0 ? (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No leads found
                  </div>
                ) : (
                  filteredLeads.slice(0, 15).map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main Tasks View ====================

export default function TasksView() {
  const {
    taskStatusFilter,
    setTaskStatusFilter,
    taskPriorityFilter,
    setTaskPriorityFilter,
    searchQuery,
    setSearchQuery,
    createTaskDialogOpen,
    setCreateTaskDialogOpen,
    setSelectedLeadId,
    setLeadDetailOpen,
    users,
  } = useAppStore();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Fetch tasks
  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTasks({
        status: taskStatusFilter,
        priority: taskPriorityFilter,
        includeCompleted: true,
        limit: 100,
      });
      setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [taskStatusFilter, taskPriorityFilter]);

  // Fetch leads for create dialog
  const loadLeads = useCallback(async () => {
    try {
      const res = await fetchLeads({ limit: 100 });
      setLeads(res.leads);
    } catch (err) {
      console.error('Failed to fetch leads for task dialog:', err);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        task.lead?.firstName?.toLowerCase().includes(q) ||
        task.lead?.lastName?.toLowerCase().includes(q) ||
        task.assignedTo?.name?.toLowerCase().includes(q),
    );
  }, [tasks, searchQuery]);

  // Sort by priority then due date
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Completed/cancelled go to bottom
      const aDone = a.status === 'COMPLETED' || a.status === 'CANCELLED' ? 1 : 0;
      const bDone = b.status === 'COMPLETED' || b.status === 'CANCELLED' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      // By priority (urgent first)
      const pa = PRIORITY_ORDER[a.priority] ?? 4;
      const pb = PRIORITY_ORDER[b.priority] ?? 4;
      if (pa !== pb) return pa - pb;

      // By due date (soonest first, null last)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // By creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredTasks]);

  // Toggle complete
  const handleToggleComplete = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setCompletingTaskId(task.id);
    try {
      await updateTask(task.id, {
        status: newStatus,
        completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null,
      });
      await loadTasks();
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Handle create task
  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    assignedToId?: string;
    leadId?: string;
    dueDate?: string;
    type?: string;
  }) => {
    try {
      await createTask(data);
      await loadTasks();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // Navigate to lead from task
  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId(leadId);
    setLeadDetailOpen(true);
  };

  // Lead options for dialog
  const leadOptions = useMemo(
    () =>
      leads.map((l) => ({
        id: l.id,
        label: `${getFullName(l.firstName, l.lastName)}${l.company ? ` · ${l.company}` : ''}`,
      })),
    [leads],
  );

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tasks.length };
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return counts;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-amber-500" />
              Task Board
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-48 h-9 text-sm"
              />
            </div>

            {/* Add Task Button */}
            <Button
              size="sm"
              onClick={() => setCreateTaskDialogOpen(true)}
              className="h-9 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
          {/* Status Tabs */}
          <Tabs
            value={taskStatusFilter}
            onValueChange={(val) => setTaskStatusFilter(val as TaskStatus | 'ALL')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="ALL" className="text-xs h-6 px-3 gap-1">
                All
                <span className="text-[10px] text-muted-foreground">
                  {statusCounts['ALL'] || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="PENDING" className="text-xs h-6 px-3 gap-1">
                Pending
                <span className="text-[10px] text-muted-foreground">
                  {statusCounts['PENDING'] || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="IN_PROGRESS" className="text-xs h-6 px-3 gap-1">
                In Progress
                <span className="text-[10px] text-muted-foreground">
                  {statusCounts['IN_PROGRESS'] || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="COMPLETED" className="text-xs h-6 px-3 gap-1">
                Completed
                <span className="text-[10px] text-muted-foreground">
                  {statusCounts['COMPLETED'] || 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Priority Filter */}
          <Select
            value={taskPriorityFilter}
            onValueChange={(val) => setTaskPriorityFilter(val as TaskPriority | 'ALL')}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priority</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${config.dot}`} />
                    {config.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assignee Filter - placeholder for future */}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto bg-background">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <TaskRowSkeleton key={i} />
              ))}
            </div>
          ) : sortedTasks.length === 0 ? (
            <EmptyTasks status={taskStatusFilter} />
          ) : (
            <div className="divide-y divide-border">
              {sortedTasks.map((task) => {
                const isExpanded = expandedTaskId === task.id;
                const isDone = task.status === 'COMPLETED' || task.status === 'CANCELLED';
                const priorityInfo = PRIORITY_CONFIG[task.priority];
                const statusInfo = TASK_STATUS_CONFIG[task.status];
                const isTaskOverdue = task.dueDate && isOverdue(task.dueDate) && !isDone;
                const isTaskDueToday = task.dueDate && isDueToday(task.dueDate) && !isDone;

                return (
                  <div
                    key={task.id}
                    className={`transition-colors ${isDone ? 'bg-muted/50' : 'hover:bg-muted/50'}`}
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      {/* Checkbox */}
                      <Checkbox
                        checked={task.status === 'COMPLETED'}
                        disabled={completingTaskId === task.id}
                        onCheckedChange={() => handleToggleComplete(task)}
                        className="shrink-0"
                      />

                      {/* Priority Dot */}
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${priorityInfo?.dot || 'bg-muted-foreground'}`}
                        title={priorityInfo?.label || task.priority}
                      />

                      {/* Expand/Collapse Toggle */}
                      <button
                        onClick={() =>
                          setExpandedTaskId(isExpanded ? null : task.id)
                        }
                        className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>

                      {/* Title */}
                      <button
                        onClick={() =>
                          setExpandedTaskId(isExpanded ? null : task.id)
                        }
                        className={`text-sm text-left min-w-0 flex-1 truncate ${
                          isDone
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground font-medium'
                        }`}
                      >
                        {task.title}
                      </button>

                      {/* Related Lead */}
                      {task.lead && (
                        <button
                          onClick={() => handleLeadClick(task.lead!.id)}
                          className="shrink-0 hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-1 rounded transition-colors"
                        >
                          <CircleDot className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {getFullName(task.lead.firstName, task.lead.lastName)}
                          </span>
                        </button>
                      )}

                      {/* Assigned To */}
                      {task.assignedTo && (
                        <div className="shrink-0 hidden md:flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                              {getInitials(task.assignedTo.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                            {task.assignedTo.name.split(' ')[0]}
                          </span>
                        </div>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <div
                          className={`shrink-0 flex items-center gap-1 text-xs px-2 py-0.5 rounded ${
                            isTaskOverdue
                              ? 'bg-red-50 text-red-600 font-medium'
                              : isTaskDueToday
                                ? 'bg-orange-50 text-orange-600 font-medium'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {isTaskOverdue && (
                            <AlertTriangle className="h-3 w-3" />
                          )}
                          {isTaskDueToday && (
                            <Clock className="h-3 w-3" />
                          )}
                          {!isTaskOverdue && !isTaskDueToday && (
                            <Calendar className="h-3 w-3" />
                          )}
                          <span className="whitespace-nowrap">
                            {isTaskOverdue
                              ? 'Overdue'
                              : isTaskDueToday
                                ? 'Today'
                                : formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <Badge
                        variant="secondary"
                        className={`shrink-0 text-[10px] font-medium h-5 px-2 ${statusInfo?.color || 'bg-muted text-muted-foreground'}`}
                      >
                        {statusInfo?.label || task.status}
                      </Badge>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && task.description && (
                      <div className="px-4 pb-3 pl-[88px]">
                        <div className="bg-muted rounded-lg p-3 border border-border">
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                            <span>Type: {task.type ? task.type.replace('_', ' ') : 'None'}</span>
                            <span>Created: {formatRelativeTime(task.createdAt)}</span>
                            {task.lead && (
                              <span>
                                Lead:{' '}
                                <button
                                  onClick={() => handleLeadClick(task.lead!.id)}
                                  className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                                >
                                  {getFullName(task.lead.firstName, task.lead.lastName)}
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={createTaskDialogOpen}
        onOpenChange={setCreateTaskDialogOpen}
        onSubmit={handleCreateTask}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
        leads={leadOptions}
      />
    </div>
  );
}
