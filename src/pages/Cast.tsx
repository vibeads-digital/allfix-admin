import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  createPerson,
  deletePerson,
  getPersons,
  updatePerson,
  type Person,
} from '@/lib/api/person';
import { getRoles } from '@/lib/api/role';
import { ApiError } from '@/lib/api/client';
import { usePageSearch } from '@/store/topbar-search';

const PERSONS_KEY = ['persons'] as const;
const ROLES_KEY = ['roles', 'for-cast-picker'] as const;
const PAGE_SIZE = 12;

const emptyForm = { name: '', photoUrl: '', bio: '', bornDate: '', nationality: '', roleIds: [] as number[] };

export function CastPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  usePageSearch('Search cast & crew…', searchQuery, (v) => {
    setSearchQuery(v);
    setPage(1);
  });

  const { data, isLoading } = useQuery({
    queryKey: [...PERSONS_KEY, searchQuery, page],
    queryFn: () =>
      getPersons({
        search: searchQuery || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => getRoles({ status: 'active', limit: 100 }),
  });
  const roles = rolesData?.roles ?? [];
  const roleName = (id: number) => roles.find((r) => r.id === id)?.name ?? `#${id}`;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: PERSONS_KEY });

  const toInput = () => ({
    name: form.name,
    photoUrl: form.photoUrl || undefined,
    bio: form.bio || undefined,
    bornDate: form.bornDate || undefined,
    nationality: form.nationality || undefined,
    roleIds: form.roleIds,
  });

  const createMutation = useMutation({
    mutationFn: async () => createPerson(toInput()),
    onSuccess: () => {
      toast.success('Person added');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => updatePerson(editing!.id, toInput()),
    onSuccess: () => {
      toast.success('Person updated');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePerson(id),
    onSuccess: () => {
      toast.success('Person deleted');
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
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (person: Person) => {
    setEditing(person);
    setForm({
      name: person.name,
      photoUrl: person.photoUrl ?? '',
      bio: person.bio ?? '',
      bornDate: person.bornDate ?? '',
      nationality: person.nationality ?? '',
      roleIds: person.roleIds,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const toggleRole = (roleId: number) => {
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId) ? f.roleIds.filter((r) => r !== roleId) : [...f.roleIds, roleId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const persons = data?.persons ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageHeader
        title="Cast & Crew"
        description="Actors, directors, and other people credited on content"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            New person
          </Button>
        }
      />
      <SectionCard title="All people" description="Manage profiles used for cast credits">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
        ) : persons.length === 0 ? (
          <EmptyState
            icon={Users}
            title={searchQuery ? 'No matching people' : 'No cast or crew yet'}
            description={searchQuery ? 'Try a different name.' : 'Add one to get started.'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {persons.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/40"
              >
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={p.photoUrl ?? undefined} alt={p.name} />
                  <AvatarFallback>{p.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.roleIds.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No roles set</span>
                    ) : (
                      p.roleIds.map((id) => (
                        <Badge key={id} variant="outline" className="text-[10px] px-1.5 py-0">
                          {roleName(id)}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => openEdit(p)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => setDeleteTarget(p)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : 'New person'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Photo URL</Label>
              <Input
                value={form.photoUrl}
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nationality</Label>
                <Input
                  value={form.nationality}
                  onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                  placeholder="e.g. Indian"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Born date</Label>
                <Input
                  type="date"
                  value={form.bornDate}
                  onChange={(e) => setForm({ ...form, bornDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Bio</Label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Roles</Label>
                <Link to="/roles" className="text-xs text-primary hover:underline">
                  Manage roles
                </Link>
              </div>
              {roles.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No roles created yet — <Link to="/roles" className="text-primary hover:underline">add some first</Link>.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={cn(
                        'text-xs px-2.5 py-1 rounded-full border',
                        form.roleIds.includes(role.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted/40',
                      )}
                    >
                      {role.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add person'}
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
              This can't be undone. If this person is still credited on any title, deletion will be blocked
              until the credit is removed.
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
