'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchLeads, updateLead, createLead } from '@/lib/api';
import { FUNNEL_STAGES, SOURCE_OPTIONS, PRIORITY_CONFIG } from '@/lib/constants';
import {
  formatRelativeTime,
  getInitials,
  getStageLabel,
  getFullName,
} from '@/lib/format';
import type { Lead, LeadStatus, FunnelStage } from '@/lib/types';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  Users,
  Inbox,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

// ==================== Score Color Helper ====================

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-700';
  if (score >= 60) return 'bg-blue-100 text-blue-700';
  if (score >= 30) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

// ==================== Lead Card Component ====================

function LeadCard({
  lead,
  stages,
  onStageChange,
  onSelectLead,
}: {
  lead: Lead;
  stages: typeof FUNNEL_STAGES;
  onStageChange: (leadId: string, newStage: FunnelStage) => void;
  onSelectLead: (leadId: string) => void;
}) {
  const currentIndex = stages.findIndex((s) => s.key === lead.funnelStage);
  const prevStage = currentIndex > 0 ? stages[currentIndex - 1] : null;
  const nextStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Card
          className="cursor-pointer border border-slate-200 bg-white p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-md group"
          onClick={() => onSelectLead(lead.id)}
        >
          <CardContent className="p-0 space-y-2">
            {/* Header row: Name + Company */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 truncate leading-tight">
                  {getFullName(lead.firstName, lead.lastName)}
                </p>
                {lead.company && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {lead.company}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Score */}
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded ${getScoreBg(lead.score)}`}
              >
                {lead.score}
              </span>

              {/* Day in funnel */}
              <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600">
                Day {lead.dayInFunnel}
              </span>

              {/* Source */}
              {lead.source && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] rounded bg-slate-50 text-slate-400 border border-slate-100">
                  {lead.source}
                </span>
              )}
            </div>

            {/* Bottom row: Time + Avatar */}
            <div className="flex items-center justify-between">
              {lead.lastEngagementAt && (
                <span className="text-[11px] text-slate-400">
                  {formatRelativeTime(lead.lastEngagementAt)}
                </span>
              )}
              {lead.assignedTo && (
                <Avatar className="h-5 w-5 ml-auto">
                  <AvatarFallback className="text-[8px] bg-slate-100 text-slate-500">
                    {getInitials(lead.assignedTo.name)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </CardContent>
        </Card>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-52">
        {/* Move to previous stage */}
        {prevStage && (
          <>
            <DropdownMenuItem
              onClick={() => onStageChange(lead.id, prevStage.key)}
              className="gap-2 text-slate-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Move to {prevStage.label}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Move to all stages */}
        {stages.map((stage) => (
          <DropdownMenuItem
            key={stage.key}
            onClick={() => onStageChange(lead.id, stage.key)}
            disabled={stage.key === lead.funnelStage}
            className="gap-2"
          >
            <span className={`h-2 w-2 rounded-full ${stage.color} shrink-0`} />
            {stage.label}
            {stage.key === lead.funnelStage && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                Current
              </Badge>
            )}
          </DropdownMenuItem>
        ))}

        {/* Move to next stage */}
        {nextStage && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onStageChange(lead.id, nextStage.key)}
              className="gap-2 text-slate-600 font-medium"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              Move to {nextStage.label}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ==================== Lead Card Skeleton ====================

function LeadCardSkeleton() {
  return (
    <Card className="border border-slate-200 bg-white p-3">
      <CardContent className="p-0 space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-8 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-14 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Empty Stage Column ====================

function EmptyStage() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
        <Inbox className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-xs text-slate-400 font-medium">No leads in this stage</p>
    </div>
  );
}

// ==================== Create Lead Dialog ====================

function CreateLeadDialog({
  open,
  onOpenChange,
  onSubmit,
  users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    assignedToId?: string;
    notes?: string;
  }) => void;
  users: { id: string; name: string }[];
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [source, setSource] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      company: company || undefined,
      source: source || undefined,
      assignedToId: assignedToId || undefined,
      notes: notes || undefined,
    });
    // Reset
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setSource('');
    setAssignedToId('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial notes about the lead..."
              rows={3}
            />
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
            <Button type="submit" disabled={!firstName.trim() || !lastName.trim()}>
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main Pipeline View ====================

export default function PipelineView() {
  const {
    leadStatusFilter,
    setLeadStatusFilter,
    searchQuery,
    setSearchQuery,
    setSelectedLeadId,
    setLeadDetailOpen,
    createLeadDialogOpen,
    setCreateLeadDialogOpen,
    users,
  } = useAppStore();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);

  // Fetch leads
  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLeads({
        status: leadStatusFilter,
        search: searchQuery || undefined,
        limit: 100,
      });
      setLeads(res.leads);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [leadStatusFilter, searchQuery]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    FUNNEL_STAGES.forEach((stage) => {
      grouped[stage.key] = leads.filter((lead) => lead.funnelStage === stage.key);
    });
    return grouped;
  }, [leads]);

  // Handle stage change
  const handleStageChange = async (leadId: string, newStage: FunnelStage) => {
    setMovingLeadId(leadId);
    try {
      await updateLead(leadId, { funnelStage: newStage });
      await loadLeads();
    } catch (err) {
      console.error('Failed to update lead stage:', err);
    } finally {
      setMovingLeadId(null);
    }
  };

  // Handle select lead
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    setLeadDetailOpen(true);
  };

  // Handle create lead
  const handleCreateLead = async (data: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    source?: string;
    assignedToId?: string;
    notes?: string;
  }) => {
    try {
      await createLead(data);
      await loadLeads();
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  };

  // Total leads count
  const totalLeads = leads.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Lead Pipeline
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              14-Day Funnel System
              {totalLeads > 0 && (
                <span className="ml-2 text-slate-400">
                  · {totalLeads} {totalLeads === 1 ? 'lead' : 'leads'}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-48 h-9 text-sm"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={leadStatusFilter}
              onValueChange={(val) => setLeadStatusFilter(val as LeadStatus | 'ALL')}
            >
              <SelectTrigger className="w-32 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="WON">Won</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Lead Button */}
            <Button
              size="sm"
              onClick={() => setCreateLeadDialogOpen(true)}
              className="h-9 gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50">
        <div className="flex gap-4 p-4 h-full min-w-max">
          {FUNNEL_STAGES.map((stage) => {
            const stageLeads = leadsByStage[stage.key] || [];

            return (
              <div
                key={stage.key}
                className="min-w-[280px] w-[280px] flex flex-col bg-slate-100/60 rounded-xl border border-slate-200/70"
              >
                {/* Column Header */}
                <div className="shrink-0 px-3 py-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${stage.color} shrink-0`}
                    />
                    <h3 className="text-sm font-semibold text-slate-700 flex-1">
                      {stage.label}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-[20px] justify-center text-[11px] font-semibold bg-slate-200 text-slate-600 hover:bg-slate-200"
                    >
                      {stageLeads.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards List */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {loading ? (
                      <>
                        <LeadCardSkeleton />
                        <LeadCardSkeleton />
                        <LeadCardSkeleton />
                      </>
                    ) : stageLeads.length === 0 ? (
                      <EmptyStage />
                    ) : (
                      stageLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          stages={FUNNEL_STAGES}
                          onStageChange={handleStageChange}
                          onSelectLead={handleSelectLead}
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        open={createLeadDialogOpen}
        onOpenChange={setCreateLeadDialogOpen}
        onSubmit={handleCreateLead}
        users={users.map((u) => ({ id: u.id, name: u.name }))}
      />
    </div>
  );
}
