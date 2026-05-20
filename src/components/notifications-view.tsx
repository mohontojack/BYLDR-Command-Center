'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchNotifications, markNotificationsRead, markAllNotificationsRead } from '@/lib/api';
import type { Notification, NotificationType } from '@/lib/types';
import { formatRelativeTime, getFullName } from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  UserPlus,
  ArrowRight,
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  BarChart3,
  Settings,
  BellOff,
  CheckCheck,
  Filter,
} from 'lucide-react';

// ==================== HELPERS ====================

interface NotifConfig {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotifConfig> = {
  LEAD_ASSIGNED: { icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  STAGE_CHANGE: { icon: ArrowRight, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  TASK_DUE: { icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  TASK_OVERDUE: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
  LEAD_ENGAGEMENT: { icon: Activity, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  AUTOMATION_ALERT: { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  DAILY_SUMMARY: { icon: BarChart3, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  SYSTEM: { icon: Settings, color: 'text-slate-500', bgColor: 'bg-slate-50' },
};

function getNotifConfig(type: NotificationType): NotifConfig {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.SYSTEM;
}

interface DateGroup {
  label: string;
  notifications: Notification[];
}

function groupByDate(notifications: Notification[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { label: string; date: Date; notifications: Notification[] }[] = [
    { label: 'Today', date: today, notifications: [] },
    { label: 'Yesterday', date: yesterday, notifications: [] },
    { label: 'Earlier', date: new Date(0), notifications: [] },
  ];

  for (const notif of notifications) {
    const notifDate = new Date(notif.createdAt);
    if (notifDate >= today) {
      groups[0].notifications.push(notif);
    } else if (notifDate >= yesterday) {
      groups[1].notifications.push(notif);
    } else {
      groups[2].notifications.push(notif);
    }
  }

  return groups.filter((g) => g.notifications.length > 0);
}

// ==================== NOTIFICATION CARD ====================

function NotificationCard({
  notification,
  onMarkRead,
  onClick,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onClick: (notification: Notification) => void;
}) {
  const config = getNotifConfig(notification.type);
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    onClick(notification);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
        !notification.read ? 'bg-muted/30' : ''
      }`}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0" />
      )}

      {/* Icon */}
      <div className={`h-9 w-9 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
              {notification.title}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {notification.message}
            </p>
            {notification.lead && (
              <p className="text-xs text-primary mt-1 hover:underline">
                {getFullName(notification.lead.firstName, notification.lead.lastName)}
                {notification.lead.company ? ` · ${notification.lead.company}` : ''}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN NOTIFICATIONS VIEW ====================

export default function NotificationsView() {
  const { currentUserId } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications(currentUserId || undefined);
      setNotifications(data.notifications);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const dateGroups = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationsRead([id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(currentUserId || 'all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Could navigate based on actionUrl in the future
    // For now just a toast or visual feedback
    if (notification.actionUrl) {
      toast.info(`Navigate to: ${notification.actionUrl}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 pb-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-xs px-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-4 pb-2">
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
          <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
            {notifications.length}
          </Badge>
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Unread
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs px-1.5">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <BellOff className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-1">
              {filter === 'unread'
                ? 'You\'re all caught up!'
                : 'Notifications will appear here when you have updates.'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-1">
              {dateGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <div className="flex items-center gap-3 mb-2 mt-2 first:mt-0">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                      {group.label}
                    </h3>
                    <Separator className="flex-1" />
                  </div>
                  <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="p-0">
                      <div className="space-y-0.5">
                        {group.notifications.map((notification) => (
                          <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onMarkRead={handleMarkRead}
                            onClick={handleNotificationClick}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
