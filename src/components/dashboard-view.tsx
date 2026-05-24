'use client';

import { useEffect, useState, useCallback } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { fetchDashboard, updateTask } from '@/lib/api';
import type { DashboardData, ActivityType, TaskPriority } from '@/lib/types';
import {
  FUNNEL_STAGES,
  PRIORITY_CONFIG,
} from '@/lib/constants';
import {
  formatRelativeTime,
  getInitials,
  isOverdue,
  getPriorityBg,
  formatPercentage,
  getFullName,
} from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  ArrowRightLeft,
  Mail,
  MailOpen,
  MailCheck,
  MessageSquare,
  MessageCircleReply,
  Phone,
  PhoneCall,
  MousePointerClick,
  FileText,
  Play,
  StickyNote,
  ListPlus,
  CheckCircle2,
  UserCheck,
  Zap,
  CalendarClock,
  ChevronRight,
  Trophy,
  Target,
  Ban,
  CheckSquare,
  Sparkles,
} from 'lucide-react';

// ==================== ACTIVITY ICON & COLOR MAPPING ====================

const ACTIVITY_ICON_MAP: Record<ActivityType, LucideIcon> = {
  LEAD_CREATED: UserPlus,
  STAGE_CHANGED: ArrowRightLeft,
  EMAIL_SENT: Mail,
  EMAIL_OPENED: MailOpen,
  EMAIL_REPLIED: MailCheck,
  SMS_SENT: MessageSquare,
  SMS_REPLIED: MessageCircleReply,
  CALL_MADE: Phone,
  CALL_COMPLETED: PhoneCall,
  LINK_CLICKED: MousePointerClick,
  FORM_SUBMITTED: FileText,
  VIDEO_VIEWED: Play,
  NOTE_ADDED: StickyNote,
  TASK_CREATED: ListPlus,
  TASK_COMPLETED: CheckCircle2,
  TASK_ASSIGNED: UserCheck,
  AUTOMATION_TRIGGERED: Zap,
  FUNNEL_DAY_ADVANCED: CalendarClock,
};

const ACTIVITY_COLOR_MAP: Record<string, string> = {
  EMAIL_SENT: 'text-blue-500',
  EMAIL_OPENED: 'text-blue-400',
  EMAIL_REPLIED: 'text-blue-600',
  SMS_SENT: 'text-green-500',
  SMS_REPLIED: 'text-green-600',
  CALL_MADE: 'text-green-500',
  CALL_COMPLETED: 'text-green-600',
  TASK_CREATED: 'text-purple-500',
  TASK_COMPLETED: 'text-purple-600',
  TASK_ASSIGNED: 'text-purple-400',
  LEAD_CREATED: 'text-orange-500',
  STAGE_CHANGED: 'text-orange-500',
  LINK_CLICKED: 'text-orange-400',
  FORM_SUBMITTED: 'text-orange-400',
  VIDEO_VIEWED: 'text-orange-400',
  NOTE_ADDED: 'text-orange-400',
  AUTOMATION_TRIGGERED: 'text-yellow-500',
  FUNNEL_DAY_ADVANCED: 'text-yellow-400',
};

const ACTIVITY_BG_MAP: Record<string, string> = {
  EMAIL_SENT: 'bg-blue-50',
  EMAIL_OPENED: 'bg-blue-50',
  EMAIL_REPLIED: 'bg-blue-50',
  SMS_SENT: 'bg-green-50',
  SMS_REPLIED: 'bg-green-50',
  CALL_MADE: 'bg-green-50',
  CALL_COMPLETED: 'bg-green-50',
  TASK_CREATED: 'bg-purple-50',
  TASK_COMPLETED: 'bg-purple-50',
  TASK_ASSIGNED: 'bg-purple-50',
  LEAD_CREATED: 'bg-orange-50',
  STAGE_CHANGED: 'bg-orange-50',
  LINK_CLICKED: 'bg-orange-50',
  FORM_SUBMITTED: 'bg-orange-50',
  VIDEO_VIEWED: 'bg-orange-50',
  NOTE_ADDED: 'bg-orange-50',
  AUTOMATION_TRIGGERED: 'bg-yellow-50',
  FUNNEL_DAY_ADVANCED: 'bg-yellow-50',
};

function getActivityIcon(type: ActivityType): LucideIcon {
  return ACTIVITY_ICON_MAP[type] || CheckSquare;
}

function getActivityColor(type: string): string {
  return ACTIVITY_COLOR_MAP[type] || 'text-slate-500';
}

function getActivityBg(type: string): string {
  return ACTIVITY_BG_MAP[type] || 'bg-slate-50';
}

// ==================== PRIORITY ORDER ====================

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

// ==================== SKELETON LOADING ====================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Row 2 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 3 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-4 w-4 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-7">
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Row 4 Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <Skeleton className="h-7 w-10 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==================== KPI CARD COMPONENT ====================

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendColor?: string;
  pulse?: boolean;
}

function KpiCard({ icon: Icon, label, value, iconBg, iconColor, trend, trendColor, pulse }: KpiCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <p className={`text-xs font-medium ${trendColor || 'text-muted-foreground'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg}`}>
            {pulse ? (
              <span className="relative flex h-5 w-5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-30 ${iconColor.replace('text-', 'bg-')}`} />
                <Icon className={`h-5 w-5 ${iconColor} relative`} />
              </span>
            ) : (
              <Icon className={`h-5 w-5 ${iconColor}`} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== MAIN DASHBOARD VIEW ====================

export default function DashboardView() {
  const {
    dashboard,
    setDashboard,
    setCurrentView,
    setSelectedLeadId,
    setLeadDetailOpen,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setDashboard]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLeadClick = useCallback((leadId: string) => {
    setSelectedLeadId(leadId);
    setLeadDetailOpen(true);
    setCurrentView('leads');
  }, [setSelectedLeadId, setLeadDetailOpen, setCurrentView]);

  const handleTaskClick = useCallback(() => {
    setCurrentView('tasks');
  }, [setCurrentView]);

  const handleTaskComplete = useCallback(async (taskId: string) => {
    setCompletedTasks((prev) => new Set(prev).add(taskId));
    try {
      await updateTask(taskId, { status: 'COMPLETED' });
      // Refresh dashboard to get updated counts
      await loadDashboard();
    } catch {
      // Revert optimistic update on failure
      setCompletedTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  }, [loadDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{error || 'No dashboard data available'}</p>
        <Button variant="outline" onClick={loadDashboard}>
          Retry
        </Button>
      </div>
    );
  }

  const { leads, tasks, todayActionItems, recentActivities, funnel } = dashboard;

  const tasksDueToday = todayActionItems.tasksDueToday;
  const leadsNeedingFollowUp = todayActionItems.leadsNeedingFollowUp;
  const overdueCount = tasks.overdue;
  const tasksDueTodayCount = tasksDueToday.length;

  // Sort tasks by priority
  const sortedTasks = [...tasksDueToday].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)
  );

  // Funnel max count for proportional bars
  const funnelMaxCount = Math.max(...FUNNEL_STAGES.map((s) => funnel.stages[s.key] || 0), 1);

  return (
    <div className="space-y-6">
      {/* ==================== ROW 1: KPI CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          icon={Users}
          label="Active Leads"
          value={leads.active}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          trend={`${leads.newToday} new today`}
          trendColor="text-emerald-600"
        />

        <KpiCard
          icon={Clock}
          label="Tasks Due Today"
          value={tasksDueTodayCount}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          trend={overdueCount > 0 ? `${overdueCount} overdue` : 'All on track'}
          trendColor={overdueCount > 0 ? 'text-red-500' : 'text-emerald-600'}
          pulse={overdueCount > 0}
        />

        <KpiCard
          icon={TrendingUp}
          label="Conversion Rate"
          value={formatPercentage(funnel.overallConversionRate)}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend="Awareness → Loyalty"
          trendColor="text-muted-foreground"
        />

        <KpiCard
          icon={AlertTriangle}
          label="Overdue Tasks"
          value={overdueCount}
          iconBg={overdueCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}
          iconColor={overdueCount > 0 ? 'text-red-600' : 'text-emerald-600'}
          trend={overdueCount === 0 ? 'All clear!' : 'Needs attention'}
          trendColor={overdueCount === 0 ? 'text-emerald-600' : 'text-red-500'}
        />
      </div>

      {/* ==================== ROW 2: FUNNEL + QUICK ACTIONS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Funnel Overview */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <CardTitle className="text-base">Funnel Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Horizontal funnel bars */}
            <div className="space-y-3">
              {FUNNEL_STAGES.map((stage) => {
                const count = funnel.stages[stage.key] || 0;
                const percentage = (count / funnelMaxCount) * 100;
                return (
                  <div key={stage.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">{stage.label}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="relative h-7 w-full rounded-lg bg-muted/50 overflow-hidden">
                      <div
                        className={`h-full rounded-lg ${stage.color} transition-all duration-700 ease-out flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                      >
                        {count > 0 && (
                          <span className="text-white text-xs font-medium drop-shadow-sm">
                            {percentage >= 15 ? `${Math.round(percentage)}%` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conversion rates */}
            {funnel.conversions.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Stage Conversions
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {funnel.conversions.map((conv) => {
                      const stageLabel = FUNNEL_STAGES.find((s) => s.key === conv.stage)?.label || conv.stage;
                      return (
                        <div
                          key={conv.stage}
                          className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
                        >
                          <span className="text-xs font-medium text-muted-foreground">{stageLabel}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="secondary" className="text-xs font-semibold tabular-nums">
                            {conv.rate !== null ? formatPercentage(conv.rate) : '—'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions — Leads to Follow Up */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">Leads to Follow Up</CardTitle>
              </div>
              {leadsNeedingFollowUp.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{leadsNeedingFollowUp.length - 5}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {leadsNeedingFollowUp.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                <p>All caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {leadsNeedingFollowUp.slice(0, 5).map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleLeadClick(lead.id)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors text-left group"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs font-medium bg-orange-50 text-orange-700">
                        {getInitials(getFullName(lead.firstName, lead.lastName))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {getFullName(lead.firstName, lead.lastName)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.company || 'No company'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs tabular-nums ${
                          lead.score >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : lead.score >= 50
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {lead.score}
                      </Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================== ROW 3: TODAY'S TASKS + ACTIVITY FEED ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Tasks */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <CardTitle className="text-base">Today&apos;s Tasks</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={handleTaskClick}
              >
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                <p>No tasks due today</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {sortedTasks.map((task) => {
                  const isCompleted = completedTasks.has(task.id) || task.status === 'COMPLETED';
                  const priorityCfg = PRIORITY_CONFIG[task.priority];
                  const isTaskOverdue = task.dueDate ? isOverdue(task.dueDate) : false;

                  return (
                    <div
                      key={task.id}
                      onClick={() => !isCompleted && handleTaskClick()}
                      className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors group ${
                        isCompleted
                          ? 'opacity-50'
                          : 'hover:bg-accent cursor-pointer'
                      }`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => {
                          if (!isCompleted) handleTaskComplete(task.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 shrink-0"
                        disabled={isCompleted}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div
                            className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${priorityCfg.dot}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                isCompleted ? 'line-through text-muted-foreground' : ''
                              } ${isTaskOverdue && !isCompleted ? 'text-red-600' : ''}`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {task.dueDate && (
                                <span
                                  className={`text-xs flex items-center gap-1 ${
                                    isTaskOverdue ? 'text-red-500' : 'text-muted-foreground'
                                  }`}
                                >
                                  <Clock className="h-3 w-3" />
                                  {formatRelativeTime(task.dueDate)}
                                </span>
                              )}
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 ${getPriorityBg(task.priority)}`}
                              >
                                {priorityCfg.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      {task.assignedTo && (
                        <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {getInitials(task.assignedTo.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent activity
              </div>
            ) : (
              <div className="relative max-h-[400px] overflow-y-auto">
                {/* Timeline line */}
                <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />

                <div className="space-y-1">
                  {recentActivities.slice(0, 10).map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    const iconColor = getActivityColor(activity.type);
                    const iconBg = getActivityBg(activity.type);

                    return (
                      <div key={activity.id} className="relative flex items-start gap-4 py-2.5 px-1">
                        {/* Timeline node */}
                        <div
                          className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${iconBg} border border-background shadow-sm`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm text-foreground leading-snug">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.createdAt)}
                            </span>
                            {activity.lead && (
                              <button
                                onClick={() => handleLeadClick(activity.lead!.id)}
                                className="text-xs text-primary hover:underline font-medium truncate max-w-[180px]"
                              >
                                {getFullName(activity.lead.firstName, activity.lead.lastName)}
                                {activity.lead.company ? ` — ${activity.lead.company}` : ''}
                              </button>
                            )}
                            {activity.user && (
                              <span className="flex items-center gap-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px] bg-muted">
                                    {getInitials(activity.user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {activity.user.name}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ==================== ROW 4: QUICK STATS BAR ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-500" />
                <span className="text-2xl font-bold tabular-nums">{leads.newToday}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">New Leads Today</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="h-4 w-4 text-emerald-500" />
                <span className="text-2xl font-bold tabular-nums">{leads.won}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Won Deals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Ban className="h-4 w-4 text-red-400" />
                <span className="text-2xl font-bold tabular-nums">{leads.lost}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Lost Leads</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold tabular-nums">{tasks.completedToday}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">Completed Today</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
