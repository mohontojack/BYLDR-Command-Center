'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAutomations,
  createAutomation,
  toggleAutomation,
  deleteAutomation,
  fetchUsers,
} from '@/lib/api';
import type { Automation, TriggerType } from '@/lib/types';
import { TRIGGER_LABELS, FUNNEL_STAGES } from '@/lib/constants';
import { formatRelativeTime, titleCase } from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus,
  Zap,
  Trash2,
  Play,
  Pause,
  ChevronRight,
  UserPlus,
  Bell,
  ArrowRight,
  Star,
  X,
  Settings2,
  Bot,
  ListPlus,
} from 'lucide-react';

// ==================== ACTION CONFIG ====================

const ACTION_TYPES = [
  { value: 'assign_task', label: 'Assign Task', icon: ListPlus },
  { value: 'send_notification', label: 'Send Notification', icon: Bell },
  { value: 'change_stage', label: 'Change Stage', icon: ArrowRight },
  { value: 'update_score', label: 'Update Score', icon: Star },
] as const;

type ActionType = (typeof ACTION_TYPES)[number]['value'];

interface AutomationAction {
  type: ActionType;
  config: Record<string, string>;
}

// ==================== CREATE AUTOMATION DIALOG ====================

function CreateAutomationDialog({
  open,
  onOpenChange,
  users,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: { id: string; name: string }[];
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<string>('');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>({});
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setTriggerType('');
    setTriggerConfig({});
    setActions([]);
  };

  const handleTriggerConfigChange = (key: string, value: string) => {
    setTriggerConfig((prev) => ({ ...prev, [key]: value }));
  };

  const addAction = () => {
    setActions((prev) => [...prev, { type: 'assign_task', config: {} }]);
  };

  const removeAction = (index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: keyof AutomationAction, value: string) => {
    setActions((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const updateActionConfig = (index: number, key: string, value: string) => {
    setActions((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, config: { ...a.config, [key]: value } } : a
      )
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Automation name is required');
      return;
    }
    if (!triggerType) {
      toast.error('Trigger type is required');
      return;
    }
    if (actions.length === 0) {
      toast.error('At least one action is required');
      return;
    }
    setSubmitting(true);
    try {
      const apiActions = actions.map((a) => ({
        type: a.type,
        ...a.config,
      }));
      await createAutomation({
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
        triggerConfig,
        actions: apiActions,
      });
      toast.success('Automation created successfully');
      resetForm();
      onCreated();
      onOpenChange(false);
    } catch {
      toast.error('Failed to create automation');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTriggerConfig = () => {
    if (triggerType === 'DAYS_IN_FUNNEL') {
      return (
        <div className="space-y-2 mt-2">
          <Label className="text-xs">Day Number</Label>
          <Input
            type="number"
            min={1}
            max={180}
            placeholder="e.g. 7"
            value={triggerConfig.dayNumber || ''}
            onChange={(e) => handleTriggerConfigChange('dayNumber', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Trigger on this specific day in the funnel.</p>
        </div>
      );
    }
    if (triggerType === 'STAGE_CHANGED') {
      return (
        <div className="space-y-2 mt-2">
          <Label className="text-xs">Stage</Label>
          <Select
            value={triggerConfig.stage || ''}
            onValueChange={(v) => handleTriggerConfigChange('stage', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {FUNNEL_STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Trigger when lead enters this stage.</p>
        </div>
      );
    }
    if (triggerType === 'LEAD_INACTIVE') {
      return (
        <div className="space-y-2 mt-2">
          <Label className="text-xs">Days Inactive</Label>
          <Input
            type="number"
            min={1}
            max={90}
            placeholder="e.g. 14"
            value={triggerConfig.days || ''}
            onChange={(e) => handleTriggerConfigChange('days', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Number of days without engagement.</p>
        </div>
      );
    }
    return null;
  };

  const renderActionConfig = (action: AutomationAction, index: number) => {
    const actionTypeConfig = ACTION_TYPES.find((at) => at.value === action.type);
    const ActionIcon = actionTypeConfig?.icon || Zap;

    return (
      <Card key={index} className="border-dashed">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActionIcon className="h-4 w-4 text-primary" />
              <Select
                value={action.type}
                onValueChange={(v) => updateAction(index, 'type', v)}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((at) => (
                    <SelectItem key={at.value} value={at.value}>
                      {at.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAction(index)}>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>

          {/* assign_task */}
          {action.type === 'assign_task' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Assign To</Label>
                <Select
                  value={action.config.assignedToId || ''}
                  onValueChange={(v) => updateActionConfig(index, 'assignedToId', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select
                  value={action.config.priority || 'MEDIUM'}
                  onValueChange={(v) => updateActionConfig(index, 'priority', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-full space-y-1">
                <Label className="text-xs">Task Title</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Follow up with lead"
                  value={action.config.taskTitle || ''}
                  onChange={(e) => updateActionConfig(index, 'taskTitle', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* send_notification */}
          {action.type === 'send_notification' && (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Notify User</Label>
                <Select
                  value={action.config.userId || ''}
                  onValueChange={(v) => updateActionConfig(index, 'userId', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Message</Label>
                <Input
                  className="h-8 text-xs"
                  placeholder="Lead needs attention"
                  value={action.config.message || ''}
                  onChange={(e) => updateActionConfig(index, 'message', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* change_stage */}
          {action.type === 'change_stage' && (
            <div className="space-y-1">
              <Label className="text-xs">Target Stage</Label>
              <Select
                value={action.config.targetStage || ''}
                onValueChange={(v) => updateActionConfig(index, 'targetStage', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {FUNNEL_STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* update_score */}
          {action.type === 'update_score' && (
            <div className="space-y-1">
              <Label className="text-xs">Score Value (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-8 text-xs"
                placeholder="85"
                value={action.config.score || ''}
                onChange={(e) => updateActionConfig(index, 'score', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Automation</DialogTitle>
          <DialogDescription>Create an automation workflow that triggers actions based on events.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Name & Description */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="autoName">Name *</Label>
              <Input
                id="autoName"
                placeholder="e.g., Follow-up on Day 7"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoDesc">Description</Label>
              <Textarea
                id="autoDesc"
                placeholder="Describe what this automation does..."
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Trigger */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Trigger
            </h4>
            <div className="space-y-2">
              <Label className="text-xs">When this happens...</Label>
              <Select value={triggerType} onValueChange={(v) => { setTriggerType(v); setTriggerConfig({}); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderTriggerConfig()}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Play className="h-4 w-4 text-primary" />
                Actions
              </h4>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Action
              </Button>
            </div>

            {actions.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No actions yet.</p>
                <p className="text-xs">Click &quot;Add Action&quot; to define what happens.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <div key={index}>
                    {index > 0 && (
                      <div className="flex items-center justify-center my-1">
                        <ChevronRight className="h-3 w-3 text-muted-foreground rotate-90" />
                      </div>
                    )}
                    {renderActionConfig(action, index)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !triggerType || actions.length === 0}>
            {submitting ? 'Creating...' : 'Create Automation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MAIN AUTOMATIONS VIEW ====================

export default function AutomationsView() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAutomations();
      setAutomations(data);
    } catch {
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data.map((u) => ({ id: u.id, name: u.name })));
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadAutomations();
    loadUsers();
  }, [loadAutomations, loadUsers]);

  const handleToggle = async (automation: Automation) => {
    setTogglingId(automation.id);
    try {
      const updated = await toggleAutomation(automation.id, !automation.enabled);
      setAutomations((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a))
      );
      toast.success(updated.enabled ? 'Automation enabled' : 'Automation disabled');
    } catch {
      toast.error('Failed to toggle automation');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAutomation(id);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
      toast.success('Automation deleted');
    } catch {
      toast.error('Failed to delete automation');
    }
  };

  const parseActions = (actions: Record<string, unknown>[]): string => {
    if (!actions || actions.length === 0) return 'No actions';

    return actions
      .map((action) => {
        const type = action.type as string;
        switch (type) {
          case 'assign_task': {
            const title = action.taskTitle || 'task';
            return `Assign "${title}"`;
          }
          case 'send_notification':
            return 'Send notification';
          case 'change_stage': {
            const stage = action.targetStage
              ? FUNNEL_STAGES.find((s) => s.key === action.targetStage)?.label || action.targetStage
              : 'new stage';
            return `Move to ${stage}`;
          }
          case 'update_score':
            return `Set score to ${action.score || 0}`;
          default:
            return titleCase(type);
        }
      })
      .join(' → ');
  };

  const getTriggerLabel = (triggerType: string): string => {
    return TRIGGER_LABELS[triggerType] || titleCase(triggerType);
  };

  const enabledCount = automations.filter((a) => a.enabled).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 pb-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automations</h1>
          <p className="text-sm text-muted-foreground">
            {automations.length} workflows · {enabledCount} active
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Automation
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto p-4 pt-3">
        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        ) : automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Settings2 className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">No automations yet</p>
            <p className="text-sm mt-1">Create your first automation to streamline your workflow.</p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {automations.map((automation) => (
              <Card
                key={automation.id}
                className={`transition-all ${
                  automation.enabled
                    ? 'border-primary/20 shadow-sm'
                    : 'border-border/50 opacity-70'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">{automation.name}</h3>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            automation.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          {automation.enabled ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      {automation.description && (
                        <p className="text-sm text-muted-foreground">{automation.description}</p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-muted-foreground">Trigger:</span>
                          <Badge variant="secondary" className="text-xs">
                            {getTriggerLabel(automation.triggerType)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Play className="h-3.5 w-3.5 text-primary" />
                          <span className="text-muted-foreground">Actions:</span>
                          <span className="text-xs truncate max-w-[300px]">
                            {parseActions(automation.actions)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Created {formatRelativeTime(automation.createdAt)}
                      </p>
                    </div>

                    {/* Right: Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={automation.enabled}
                          onCheckedChange={() => handleToggle(automation)}
                          disabled={togglingId === automation.id}
                        />
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Automation</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{automation.name}&quot;? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDelete(automation.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateAutomationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        users={users}
        onCreated={loadAutomations}
      />
    </div>
  );
}
