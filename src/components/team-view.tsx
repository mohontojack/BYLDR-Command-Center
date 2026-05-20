'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchUsers, createUser, updateUser } from '@/lib/api';
import type { User, UserRole } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/constants';
import { getInitials, formatRelativeTime } from '@/lib/format';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Mail,
  Phone,
  UserCheck,
  UserX,
  Users,
  ListTodo,
  CheckCircle2,
  Shield,
} from 'lucide-react';

// ==================== HELPERS ====================

function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'CSO':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'TECH_LEAD':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'CONTRACTOR':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function getAvatarBg(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-500';
    case 'CSO':
      return 'bg-emerald-500';
    case 'TECH_LEAD':
      return 'bg-blue-500';
    case 'CONTRACTOR':
      return 'bg-slate-500';
    default:
      return 'bg-slate-500';
  }
}

// ==================== ADD / EDIT MEMBER DIALOG ====================

function MemberDialog({
  open,
  onOpenChange,
  existingMember,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingMember: User | null;
  onSaved: () => void;
}) {
  const isEdit = !!existingMember;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('CSO');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && existingMember) {
      setName(existingMember.name);
      setEmail(existingMember.email);
      setRole(existingMember.role);
      setPhone(existingMember.phone || '');
    } else if (open && !existingMember) {
      setName('');
      setEmail('');
      setRole('CSO');
      setPhone('');
    }
  }, [open, existingMember]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit && existingMember) {
        await updateUser(existingMember.id, {
          name: name.trim(),
          email: email.trim(),
          role: role as UserRole,
          phone: phone.trim() || undefined,
        });
        toast.success('Member updated');
      } else {
        await createUser({
          name: name.trim(),
          email: email.trim(),
          role: role as UserRole,
          phone: phone.trim() || undefined,
        });
        toast.success('Member added');
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error(isEdit ? 'Failed to update member' : 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Member' : 'Add Team Member'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update ${existingMember?.name}'s information.`
              : 'Add a new member to the team.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="memberName">Name *</Label>
            <Input
              id="memberName"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberEmail">Email *</Label>
            <Input
              id="memberEmail"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="memberPhone">Phone</Label>
            <Input
              id="memberPhone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== TEAM MEMBER CARD ====================

function TeamMemberCard({
  member,
  onEdit,
}: {
  member: User;
  onEdit: (member: User) => void;
}) {
  const roleColor = getRoleColor(member.role);
  const avatarBg = getAvatarBg(member.role);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarFallback className={`${avatarBg} text-white text-xl font-semibold`}>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            {/* Active/Inactive indicator */}
            <div
              className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background ${
                member.active ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
          </div>

          {/* Info */}
          <div className="space-y-1 w-full">
            <h3 className="font-semibold text-base">{member.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
            <Badge variant="outline" className={roleColor}>
              {ROLE_LABELS[member.role] || member.role}
            </Badge>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 w-full pt-1">
            <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
              <Users className="h-3.5 w-3.5 text-muted-foreground mb-1" />
              <span className="text-sm font-semibold">
                {member._count?.assignedLeads ?? '—'}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Leads</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
              <ListTodo className="h-3.5 w-3.5 text-muted-foreground mb-1" />
              <span className="text-sm font-semibold">
                {member._count?.assignedTasks ?? '—'}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Tasks</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-md bg-muted/50">
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground mb-1" />
              <span className="text-sm font-semibold">—</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Done</span>
            </div>
          </div>

          {/* Contact & Actions */}
          <div className="flex items-center gap-2 w-full pt-1">
            {member.phone && (
              <Button variant="ghost" size="sm" className="flex-1 text-xs h-8">
                <Phone className="h-3.5 w-3.5 mr-1" />
                Call
              </Button>
            )}
            <Button variant="ghost" size="sm" className="flex-1 text-xs h-8">
              <Mail className="h-3.5 w-3.5 mr-1" />
              Email
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs h-8"
              onClick={() => onEdit(member)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            {member.active ? (
              <>
                <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Active</span>
              </>
            ) : (
              <>
                <UserX className="h-3.5 w-3.5" />
                <span>Inactive</span>
              </>
            )}
            <span className="mx-1">·</span>
            <span>Joined {formatRelativeTime(member.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== MAIN TEAM VIEW ====================

export default function TeamView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAdd = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  const handleEdit = (member: User) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    loadUsers();
  };

  const activeCount = users.filter((u) => u.active).length;
  const totalLeads = users.reduce((sum, u) => sum + (u._count?.assignedLeads || 0), 0);
  const totalTasks = users.reduce((sum, u) => sum + (u._count?.assignedTasks || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 pb-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} members · {activeCount} active · {totalLeads} leads · {totalTasks} tasks
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <Badge key={role} variant="outline" className={getRoleColor(role as UserRole)}>
              {label}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-auto px-4 pb-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Shield className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium">No team members</p>
            <p className="text-sm mt-1">Add your first team member to get started.</p>
            <Button className="mt-4" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((member) => (
              <TeamMemberCard key={member.id} member={member} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      <MemberDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingMember(null);
        }}
        existingMember={editingMember}
        onSaved={handleSaved}
      />
    </div>
  );
}
