'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import {
  fetchLeads,
  fetchLead,
  createLead,
  updateLead,
  createTask,
  fetchUsers,
} from '@/lib/api';
import type { Lead, Task, Activity, User, FunnelStage, LeadStatus } from '@/lib/types';
import { FUNNEL_STAGES, SOURCE_OPTIONS, ROLE_LABELS } from '@/lib/constants';
import {
  formatRelativeTime,
  getInitials,
  getFullName,
  getStageLabel,
  getStatusLabel,
  getPriorityLabel,
  getPriorityBg,
  getStatusBg,
  titleCase,
} from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Mail,
  Phone,
  Building2,
  Tag,
  ChevronRight,
  ListPlus,
  StickyNote,
  MoreHorizontal,
  User,
  Star,
  Clock,
  ExternalLink,
} from 'lucide-react';

// ==================== HELPERS ====================

function getStageLightColor(stage: string): string {
  const found = FUNNEL_STAGES.find((s) => s.key === stage);
  return found?.lightColor || 'bg-slate-100 text-slate-700';
}

function getStageProgressIndex(stage: FunnelStage): number {
  return FUNNEL_STAGES.findIndex((s) => s.key === stage);
}

function getNextStage(currentStage: FunnelStage): FunnelStage | null {
  const idx = FUNNEL_STAGES.findIndex((s) => s.key === currentStage);
  if (idx < FUNNEL_STAGES.length - 1) {
    return FUNNEL_STAGES[idx + 1].key;
  }
  return null;
}

type SortField = 'name' | 'stage' | 'score' | 'dayInFunnel' | 'createdAt';
type SortDir = 'asc' | 'desc';

// ==================== CREATE LEAD DIALOG ====================

function CreateLeadDialog({
  open,
  onOpenChange,
  users,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    source: 'NXL BYLDR',
    assignedToId: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setSubmitting(true);
    try {
      await createLead({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        source: form.source,
        assignedToId: form.assignedToId || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success('Lead created successfully');
      onCreated();
      onOpenChange(false);
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        source: 'NXL BYLDR',
        assignedToId: '',
        notes: '',
      });
    } catch (err) {
      toast.error('Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>Create a new lead in the funnel.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Acme Corp"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={form.source}
                onValueChange={(v) => setForm({ ...form, source: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((src) => (
                    <SelectItem key={src} value={src}>
                      {src}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select
                value={form.assignedToId}
                onValueChange={(v) => setForm({ ...form, assignedToId: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== QUICK TASK DIALOG ====================

function QuickTaskDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  users: User[];
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Task title is required');
      return;
    }
    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        assignedToId: assignedToId || undefined,
        leadId,
        dueDate: dueDate || undefined,
        type: 'follow_up',
      });
      toast.success('Task created');
      onOpenChange(false);
      setTitle('');
      setPriority('MEDIUM');
      setAssignedToId('');
      setDueDate('');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>
            Create a task for <span className="font-medium text-foreground">{leadName}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="taskTitle">Title *</Label>
            <Input
              id="taskTitle"
              placeholder="Follow up on proposal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
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
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== LEAD DETAIL PANEL ====================

function LeadDetailPanel({
  lead,
  onClose,
  users,
  onRefresh,
}: {
  lead: Lead;
  onClose: () => void;
  users: User[];
  onRefresh: () => void;
}) {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const activities = lead.activities || [];
  const tasks = lead.tasks || [];
  const stageIndex = getStageProgressIndex(lead.funnelStage);
  const progressPct = Math.round(((stageIndex + 1) / FUNNEL_STAGES.length) * 100);
  const nextStage = getNextStage(lead.funnelStage);
  const tags = lead.tags ? lead.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const handleMoveStage = async () => {
    if (!nextStage) return;
    try {
      await updateLead(lead.id, { funnelStage: nextStage });
      toast.success(`Moved to ${getStageLabel(nextStage)}`);
      onRefresh();
    } catch {
      toast.error('Failed to move lead');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setAddingNote(true);
    try {
      await updateLead(lead.id, {
        notes: [lead.notes, noteText.trim()].filter(Boolean).join('\n---\n'),
      });
      toast.success('Note added');
      setNoteText('');
      onRefresh();
    } catch {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-semibold">
              {getInitials(getFullName(lead.firstName, lead.lastName))}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h3 className="font-semibold text-base truncate">
              {getFullName(lead.firstName, lead.lastName)}
            </h3>
            <p className="text-xs text-muted-foreground truncate">{lead.company || 'No company'}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{lead.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{lead.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{lead.company || 'No company'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Source: {lead.source}</span>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Funnel Progression */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Funnel Stage</h4>
              <Badge className={getStageLightColor(lead.funnelStage)} variant="outline">
                {getStageLabel(lead.funnelStage)}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Awareness</span>
                <span>Loyalty</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Day {lead.dayInFunnel} in funnel
              </p>
            </div>
            <div className="flex gap-2">
              {nextStage && (
                <Button size="sm" onClick={handleMoveStage} className="flex-1">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Move to {getStageLabel(nextStage)}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTaskDialogOpen(true)}
                className="flex-1"
              >
                <ListPlus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
          </div>

          <Separator />

          {/* Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500" />
                Lead Score
              </h4>
              <span className="text-2xl font-bold">{lead.score}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  lead.score >= 80
                    ? 'bg-emerald-500'
                    : lead.score >= 50
                      ? 'bg-amber-500'
                      : lead.score >= 25
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${lead.score}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {lead.score >= 80
                ? 'Hot lead — ready to engage'
                : lead.score >= 50
                  ? 'Warm lead — showing interest'
                  : lead.score >= 25
                    ? 'Nurture — needs attention'
                    : 'Cold — low engagement'}
            </p>
          </div>

          <Separator />

          {/* Activity Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Recent Activity</h4>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {activities.slice(0, 15).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Related Tasks */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Related Tasks ({tasks.length})</h4>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.dueDate && formatRelativeTime(task.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge className={getPriorityBg(task.priority)} variant="outline">
                        {getPriorityLabel(task.priority)}
                      </Badge>
                      <Badge className={getStatusBg(task.status)} variant="outline">
                        {getStatusLabel(task.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Quick Note */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <StickyNote className="h-4 w-4" />
              Quick Note
            </h4>
            {lead.notes && (
              <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                {lead.notes}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Add a quick note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button size="sm" onClick={handleAddNote} disabled={addingNote || !noteText.trim()}>
                {addingNote ? '...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>

      <QuickTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        leadId={lead.id}
        leadName={getFullName(lead.firstName, lead.lastName)}
        users={users}
      />
    </div>
  );
}

// ==================== MAIN LEADS VIEW ====================

export default function LeadsView() {
  const { selectedLeadId, setSelectedLeadId } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<FunnelStage | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');

  // Sort
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Detail
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeads({
        stage: stageFilter,
        status: statusFilter,
        search: search || undefined,
        sort: sortField,
        order: sortDir,
        limit: 100,
      });
      setLeads(data.leads);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [stageFilter, statusFilter, search, sortField, sortDir]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadLeadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      try {
        const lead = await fetchLead(id);
        setSelectedLead(lead);
      } catch {
        toast.error('Failed to load lead details');
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedLeadId) {
      loadLeadDetail(selectedLeadId);
    } else {
      setSelectedLead(null);
    }
  }, [selectedLeadId, loadLeadDetail]);

  const handleRowClick = (lead: Lead) => {
    if (selectedLeadId === lead.id) {
      setSelectedLeadId(null);
    } else {
      setSelectedLeadId(lead.id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-primary" />
    );
  };

  const handleClearFilters = () => {
    setSearch('');
    setStageFilter('ALL');
    setStatusFilter('ALL');
  };

  const hasFilters = search || stageFilter !== 'ALL' || statusFilter !== 'ALL';

  const getUserName = (userId?: string | null) => {
    if (!userId) return 'Unassigned';
    const u = users.find((u) => u.id === userId);
    return u?.name || 'Unknown';
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 pb-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
            <p className="text-sm text-muted-foreground">{leads.length} leads found</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-4 pb-2">
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              className="pl-8 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as FunnelStage | 'ALL')}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              {FUNNEL_STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | 'ALL')}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="WON">Won</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Table */}
          <div className="flex-1 min-w-0 overflow-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <User className="h-10 w-10 mb-2 opacity-40" />
                <p className="font-medium">No leads found</p>
                <p className="text-sm">Try adjusting your filters or add a new lead.</p>
              </div>
            ) : (
              <div className="border rounded-lg m-4 mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('name')}
                      >
                        <span className="flex items-center">
                          Name <SortIcon field="name" />
                        </span>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Company</TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort('stage')}
                      >
                        <span className="flex items-center">
                          Stage <SortIcon field="stage" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none text-right"
                        onClick={() => handleSort('score')}
                      >
                        <span className="flex items-center justify-end">
                          Score <SortIcon field="score" />
                        </span>
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">Assigned To</TableHead>
                      <TableHead className="hidden lg:table-cell">Last Activity</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className={`cursor-pointer transition-colors ${
                          selectedLeadId === lead.id
                            ? 'bg-primary/5 border-l-2 border-l-primary'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleRowClick(lead)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarFallback className="bg-violet-100 text-violet-700 text-[10px] font-semibold">
                                {getInitials(getFullName(lead.firstName, lead.lastName))}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {getFullName(lead.firstName, lead.lastName)}
                              </p>
                              <p className="text-xs text-muted-foreground truncate md:hidden">
                                {lead.company || lead.email || '—'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[150px]">
                          {lead.company || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStageLightColor(lead.funnelStage)} variant="outline">
                            {getStageLabel(lead.funnelStage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm font-semibold">{lead.score}</span>
                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${
                                  lead.score >= 80
                                    ? 'bg-emerald-500'
                                    : lead.score >= 50
                                      ? 'bg-amber-500'
                                      : lead.score >= 25
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                }`}
                                style={{ width: `${lead.score}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-[120px]">
                          {getUserName(lead.assignedToId)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
                          {lead.lastEngagementAt
                            ? formatRelativeTime(lead.lastEngagementAt)
                            : lead.lastContactAt
                              ? formatRelativeTime(lead.lastContactAt)
                              : '—'}
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(lead);
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View details</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedLeadId && (
            <div className="w-full sm:w-[380px] lg:w-[420px] border-l bg-background shrink-0 overflow-hidden hidden sm:block">
              {detailLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Separator />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : selectedLead ? (
                <LeadDetailPanel
                  lead={selectedLead}
                  onClose={() => setSelectedLeadId(null)}
                  users={users}
                  onRefresh={() => {
                    loadLeads();
                    if (selectedLeadId) loadLeadDetail(selectedLeadId);
                  }}
                />
              ) : null}
            </div>
          )}
        </div>

        <CreateLeadDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          users={users}
          onCreated={loadLeads}
        />
      </div>
    </TooltipProvider>
  );
}
