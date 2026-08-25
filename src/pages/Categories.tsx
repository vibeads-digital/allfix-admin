import { useState } from 'react';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
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
  createGenre,
  deleteGenre,
  getGenres,
  setGenreStatus,
  updateGenre,
  type Genre,
} from '@/lib/api/genre';
import { ApiError } from '@/lib/api/client';
import { usePageSearch } from '@/store/topbar-search';

const GENRES_KEY = ['genres'] as const;
const PAGE_SIZE = 10;

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Genre | null>(null);
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'name-asc' | 'name-desc' | 'created-desc' | 'created-asc'>('name-asc');
  const [searchQuery, setSearchQuery] = useState('');
  usePageSearch('Search categories…', searchQuery, (v) => {
    setSearchQuery(v);
    setPage(1);
  });

  const [orderBy, order] = sort.startsWith('name')
    ? (['name', sort.endsWith('asc') ? 'asc' : 'desc'] as const)
    : (['createdAt', sort.endsWith('asc') ? 'asc' : 'desc'] as const);

  const { data, isLoading } = useQuery({
    queryKey: [...GENRES_KEY, statusFilter, searchQuery, sort, page],
    queryFn: () =>
      getGenres({
        status: statusFilter,
        search: searchQuery || undefined,
        orderBy,
        order,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: GENRES_KEY });

  const createMutation = useMutation({
    mutationFn: () => createGenre({ name, imageUrl: imageUrl || undefined }),
    onSuccess: () => {
      toast.success('Category created');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      // null (not undefined) so clearing the picker actually clears imageUrl
      // server-side instead of being dropped as "no change".
      updateGenre(editing!.id, { name, imageUrl: imageUrl || null }),
    onSuccess: () => {
      toast.success('Category updated');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setGenreStatus(id, isActive),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGenre(id),
    onSuccess: () => {
      toast.success('Category deleted');
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      toast.error(
        err.message,
        err instanceof ApiError && err.highlight
          ? { description: err.highlight }
          : undefined,
      );
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setImageUrl('');
    setDialogOpen(true);
  };

  const openEdit = (genre: Genre) => {
    setEditing(genre);
    setName(genre.name);
    setImageUrl(genre.imageUrl ?? '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setName('');
    setImageUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const genres = data?.genres ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group content into discoverable buckets"
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
              New category
            </Button>
          </>
        }
      />
      <SectionCard
        title="All categories"
        description="Genres used to tag and browse content"
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Loading…
          </div>
        ) : genres.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={searchQuery ? "No matching categories" : "No categories yet"}
            description={searchQuery ? "Try a different name." : "Create one to get started."}
          />
        ) : (
          <ul className="space-y-2 mt-2">
            {genres.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/40"
              >
                {g.imageUrl ? (
                  <img
                    src={g.imageUrl}
                    alt=""
                    className="size-9 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="size-9 rounded bg-muted shrink-0 grid place-items-center">
                    <FolderTree className="size-4 text-primary" />
                  </div>
                )}
                <div className="min-w-[120px] flex-1">
                  <div className="font-medium text-sm truncate">{g.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(g.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  <StatusBadge status={g.isActive ? 'Active' : 'Draft'} />
                  <Switch
                    checked={g.isActive}
                    onCheckedChange={(checked) =>
                      statusMutation.mutate({ id: g.id, isActive: checked })
                    }
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(g)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setDeleteTarget(g)}
                  >
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
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </SectionCard>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit category' : 'New category'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="genre-name">Name</Label>
              <Input
                id="genre-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Action & Adventure"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="genre-image">
                Image URL{' '}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="genre-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Create category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. If this category is still tagged on any
              movie or show, deletion will be blocked until it's removed from
              all of them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
