import { useState } from 'react';
import { Languages as LanguagesIcon, Plus, Trash2 } from 'lucide-react';
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
  createLanguage,
  deleteLanguage,
  getLanguages,
  setLanguageStatus,
  updateLanguage,
  type Language,
} from '@/lib/api/language';
import { ApiError } from '@/lib/api/client';
import { usePageSearch } from '@/store/topbar-search';

const LANGUAGES_KEY = ['languages'] as const;
const PAGE_SIZE = 10;

export function LanguagesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Language | null>(null);
  const [form, setForm] = useState({ name: '', code: '' });
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'name-asc' | 'name-desc' | 'created-desc' | 'created-asc'>('name-asc');
  const [searchQuery, setSearchQuery] = useState('');
  usePageSearch('Search languages…', searchQuery, (v) => {
    setSearchQuery(v);
    setPage(1);
  });

  const [orderBy, order] = sort.startsWith('name')
    ? (['name', sort.endsWith('asc') ? 'asc' : 'desc'] as const)
    : (['createdAt', sort.endsWith('asc') ? 'asc' : 'desc'] as const);

  const { data, isLoading } = useQuery({
    queryKey: [...LANGUAGES_KEY, statusFilter, searchQuery, sort, page],
    queryFn: () =>
      getLanguages({
        status: statusFilter,
        search: searchQuery || undefined,
        orderBy,
        order,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: LANGUAGES_KEY });

  const createMutation = useMutation({
    mutationFn: () => createLanguage({ name: form.name, code: form.code.toLowerCase() }),
    onSuccess: () => {
      toast.success('Language created');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () => updateLanguage(editing!.id, { name: form.name, code: form.code.toLowerCase() }),
    onSuccess: () => {
      toast.success('Language updated');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setLanguageStatus(id, isActive),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLanguage(id),
    onSuccess: () => {
      toast.success('Language deleted');
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
    setForm({ name: '', code: '' });
    setDialogOpen(true);
  };

  const openEdit = (language: Language) => {
    setEditing(language);
    setForm({ name: language.name, code: language.code });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ name: '', code: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const languages = data?.languages ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageHeader
        title="Languages"
        description="Languages available for content audio and subtitles"
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
              New language
            </Button>
          </>
        }
      />
      <SectionCard title="All languages" description="Used to tag dubbed/subtitled content">
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
        ) : languages.length === 0 ? (
          <EmptyState
            icon={LanguagesIcon}
            title={searchQuery ? 'No matching languages' : 'No languages yet'}
            description={searchQuery ? 'Try a different name.' : 'Create one to get started.'}
          />
        ) : (
          <ul className="space-y-2 mt-2">
            {languages.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/40"
              >
                <LanguagesIcon className="size-4 text-primary shrink-0" />
                <div className="min-w-[120px] flex-1">
                  <div className="font-medium text-sm truncate">
                    {l.name} <span className="text-muted-foreground font-normal">({l.code})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(l.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <StatusBadge status={l.isActive ? 'Active' : 'Draft'} />
                  <Switch
                    checked={l.isActive}
                    onCheckedChange={(checked) => statusMutation.mutate({ id: l.id, isActive: checked })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(l)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(l)}>
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
            <DialogTitle>{editing ? 'Edit language' : 'New language'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lang-name">Name</Label>
              <Input
                id="lang-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Hindi"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lang-code">Code</Label>
              <Input
                id="lang-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. hi"
                maxLength={10}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create language'}
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
              This can't be undone. If this language is still tagged on any movie or show, deletion will be
              blocked until it's removed from all of them.
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
