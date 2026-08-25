import { useState } from 'react';
import { Drama, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createRole,
  deleteRole,
  getRoles,
  setRoleStatus,
  updateRole,
  type Role,
} from '@/lib/api/role';
import { ApiError } from '@/lib/api/client';
import { usePageSearch } from '@/store/topbar-search';

const ROLES_KEY = ['roles'] as const;
const PAGE_SIZE = 10;

export function RolesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'name-asc' | 'name-desc' | 'created-desc' | 'created-asc'>('name-asc');
  const [searchQuery, setSearchQuery] = useState('');
  usePageSearch('Search roles…', searchQuery, (v) => {
    setSearchQuery(v);
    setPage(1);
  });

  const [orderBy, order] = sort.startsWith('name')
    ? (['name', sort.endsWith('asc') ? 'asc' : 'desc'] as const)
    : (['createdAt', sort.endsWith('asc') ? 'asc' : 'desc'] as const);

  const { data, isLoading } = useQuery({
    queryKey: [...ROLES_KEY, statusFilter, searchQuery, sort, page],
    queryFn: () =>
      getRoles({
        status: statusFilter,
        search: searchQuery || undefined,
        orderBy,
        order,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ROLES_KEY });

  const createMutation = useMutation({
    mutationFn: () => createRole({ name }),
    onSuccess: () => {
      toast.success('Role created');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateRole(editing!.id, { name }),
    onSuccess: () => {
      toast.success('Role updated');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setRoleStatus(id, isActive),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      toast.success('Role deleted');
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(err.message, err instanceof ApiError && err.highlight ? { description: err.highlight } : undefined);
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDialogOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setName(role.name);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const roles = data?.roles ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageHeader
        title="Roles"
        description="Cast & crew roles — actor, director, and any custom roles you add"
        actions={
          <>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as typeof statusFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => { setSort(v as typeof sort); setPage(1); }}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                <SelectItem value="created-desc">Newest first</SelectItem>
                <SelectItem value="created-asc">Oldest first</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-2" />
              New role
            </Button>
          </>
        }
      />
      <SectionCard title="All roles" description="Used when crediting people on cast & crew">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={Drama}
            title={searchQuery ? 'No matching roles' : 'No roles yet'}
            description={searchQuery ? 'Try a different name.' : 'Create one to get started.'}
          />
        ) : (
          <ul className="space-y-2 mt-2">
            {roles.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/40"
              >
                <Drama className="size-4 text-primary shrink-0" />
                <div className="min-w-[120px] flex-1">
                  <div className="font-medium text-sm truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <StatusBadge status={r.isActive ? 'Active' : 'Draft'} />
                  <Switch
                    checked={r.isActive}
                    onCheckedChange={(checked) => statusMutation.mutate({ id: r.id, isActive: checked })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(r)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit role' : 'New role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Name</Label>
              <Input
                id="role-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cinematographer"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. If this role is still used on any cast credit or person profile,
              deletion will be blocked until it's removed from all of them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
