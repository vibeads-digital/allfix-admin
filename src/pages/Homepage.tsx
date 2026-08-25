import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FolderHeart,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CollectionSelect } from '@/components/common/CollectionSelect';
import { EmptyState } from '@/components/common/EmptyState';
import { GenreSelect } from '@/components/common/GenreSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/components/common/SectionCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Switch } from '@/components/ui/switch';
import { getCollections } from '@/lib/api/collections';
import { getGenres } from '@/lib/api/genre';
import {
  createSection,
  deleteSection,
  getSections,
  reorderSection,
  setSectionStatus,
  updateSection,
  type HomeSection,
  type HomeSectionSortBy,
  type HomeSectionType,
} from '@/lib/api/homeSections';

const TYPE_LABEL: Record<HomeSectionType, string> = {
  hero: 'Hero Banner',
  trending: 'Trending',
  new_release: 'New Releases',
  continue_watching: 'Continue Watching',
  for_you: 'For You',
  collection: 'Featured Collection',
  category: 'Category Row',
  collections: 'Collection Tiles',
  categories: 'Category Tiles',
  all: 'All Content',
};

const TYPE_OPTIONS = Object.entries(TYPE_LABEL) as [HomeSectionType, string][];

const SORT_BY_LABEL: Record<HomeSectionSortBy, string> = {
  title_asc: 'Title (A → Z)',
  title_desc: 'Title (Z → A)',
  release_year_desc: 'Release Year (Newest first)',
  release_year_asc: 'Release Year (Oldest first)',
  created_at_desc: 'Recently Added',
  created_at_asc: 'Oldest Added',
};

const SORT_BY_OPTIONS = Object.entries(SORT_BY_LABEL) as [HomeSectionSortBy, string][];

const emptyForm = {
  type: 'trending' as HomeSectionType,
  title: '',
  collectionId: '',
  genreId: '',
  collectionIds: [] as number[],
  genreIds: [] as number[],
  sortBy: '' as HomeSectionSortBy | '',
};

export function HomepagePage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<HomeSection | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['home-sections'],
    queryFn: getSections,
  });
  const { data: collectionsData } = useQuery({
    queryKey: ['collections', 'active'],
    queryFn: () => getCollections({ status: 'active', limit: 100 }),
  });
  const { data: genresData } = useQuery({
    queryKey: ['genres', 'active'],
    queryFn: () => getGenres({ status: 'active', limit: 100 }),
  });
  const collections = collectionsData?.collections ?? [];
  const genres = genresData?.genres ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['home-sections'] });

  const closeFormDialog = () => {
    setCreateOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (s: HomeSection) => {
    setEditing(s);
    setForm({
      type: s.type,
      title: s.title,
      collectionId: s.collectionId ? String(s.collectionId) : '',
      genreId: s.genreId ? String(s.genreId) : '',
      collectionIds: s.collectionIds ?? [],
      genreIds: s.genreIds ?? [],
      sortBy: s.sortBy ?? '',
    });
  };

  const showsCollectionPicker =
    form.type === 'collection' || form.type === 'hero';

  const createMutation = useMutation({
    mutationFn: () =>
      createSection({
        type: form.type,
        title: form.title,
        ...(showsCollectionPicker && form.collectionId
          ? { collectionId: Number(form.collectionId) }
          : {}),
        ...(form.type === 'category' ? { genreId: Number(form.genreId) } : {}),
        ...(form.type === 'collections'
          ? { collectionIds: form.collectionIds }
          : {}),
        ...(form.type === 'categories' ? { genreIds: form.genreIds } : {}),
        ...(form.type === 'all' && form.sortBy ? { sortBy: form.sortBy } : {}),
      }),
    onSuccess: () => {
      toast.success('Section added');
      invalidate();
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateSection(editing!.id, {
        type: form.type,
        title: form.title,
        collectionId:
          showsCollectionPicker && form.collectionId
            ? Number(form.collectionId)
            : null,
        genreId: form.type === 'category' ? Number(form.genreId) : null,
        collectionIds: form.type === 'collections' ? form.collectionIds : [],
        genreIds: form.type === 'categories' ? form.genreIds : [],
        ...(form.type === 'all' && form.sortBy ? { sortBy: form.sortBy } : {}),
      }),
    onSuccess: () => {
      toast.success('Section updated');
      invalidate();
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setSectionStatus(id, isActive),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSection(id),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, displayOrder }: { id: number; displayOrder: number }) =>
      reorderSection(id, displayOrder),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const moveSection = (index: number, direction: -1 | 1) => {
    const current = sections[index];
    const other = sections[index + direction];
    if (!other) return;
    reorderMutation.mutate({
      id: current.id,
      displayOrder: other.displayOrder,
    });
    reorderMutation.mutate({
      id: other.id,
      displayOrder: current.displayOrder,
    });
  };

  const canSubmit =
    !!form.title &&
    (form.type !== 'collection' || !!form.collectionId) &&
    (form.type !== 'category' || !!form.genreId) &&
    (form.type !== 'collections' || form.collectionIds.length > 0) &&
    (form.type !== 'categories' || form.genreIds.length > 0) &&
    (form.type !== 'all' || !!form.sortBy);

  return (
    <>
      <PageHeader
        title="Homepage"
        description="What shows on Home, and in what order"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            Add section
          </Button>
        }
      />
      <SectionCard
        title="Section order"
        description="Move sections up/down to change how users see the homepage"
      >
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">
            Loading…
          </div>
        ) : sections.length === 0 ? (
          <EmptyState
            icon={FolderHeart}
            title="No sections yet"
            description="Add one to start building the homepage."
          />
        ) : (
          <ul className="space-y-2 mt-2">
            {sections.map((s, index) => (
              <li
                key={s.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] gap-3 items-center p-3 rounded-lg border border-border bg-muted/20 hover:border-primary/40"
              >
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    disabled={index === 0}
                    onClick={() => moveSection(index, -1)}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-5"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(index, 1)}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {TYPE_LABEL[s.type]}
                    {s.collectionTitle && ` · ${s.collectionTitle}`}
                    {s.genreName && ` · ${s.genreName}`}
                    {s.collectionTitles.length > 0 &&
                      ` · ${s.collectionTitles.join(', ')}`}
                    {s.genreNames.length > 0 && ` · ${s.genreNames.join(', ')}`}
                    {s.sortBy && ` · ${SORT_BY_LABEL[s.sortBy]}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.isActive ? 'Active' : 'Paused'} />
                  <Switch
                    checked={s.isActive}
                    onCheckedChange={(checked) =>
                      statusMutation.mutate({ id: s.id, isActive: checked })
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7"
                  aria-label="Edit"
                  onClick={() => openEdit(s)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive"
                  aria-label="Delete"
                  onClick={() => deleteMutation.mutate(s.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog
        open={createOpen || !!editing}
        onOpenChange={(open) => !open && closeFormDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit "${editing.title}"` : 'Add section'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update this section.'
                : 'Choose what this row shows, then give it a title.'}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editing) editMutation.mutate();
              else createMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    type: v as HomeSectionType,
                    collectionId: '',
                    genreId: '',
                    collectionIds: [],
                    genreIds: [],
                    sortBy: '',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showsCollectionPicker && (
              <div className="space-y-1.5">
                <Label>
                  Collection{' '}
                  {form.type === 'collection' && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Select
                  value={
                    form.type === 'hero'
                      ? form.collectionId || 'none'
                      : form.collectionId
                  }
                  onValueChange={(v) =>
                    setForm({ ...form, collectionId: v === 'none' ? '' : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a collection" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.type === 'hero' && (
                      <SelectItem value="none">
                        No collection — auto (Featured titles)
                      </SelectItem>
                    )}
                    {collections.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.type === 'hero' ? (
                  <p className="text-xs text-muted-foreground">
                    Pick a collection to control exactly what's in the hero
                    banner, or leave on auto to use titles marked Featured.
                  </p>
                ) : (
                  collections.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      <FolderHeart className="size-3 inline mr-1" />
                      No active collections — create one under Collections
                      first.
                    </p>
                  )
                )}
              </div>
            )}

            {form.type === 'collections' && (
              <div className="space-y-1.5">
                <Label>
                  Collections <span className="text-destructive">*</span>
                </Label>
                <CollectionSelect
                  value={form.collectionIds}
                  onChange={(collectionIds) =>
                    setForm({ ...form, collectionIds })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Each picked collection shows as a tile in this row — tapping
                  one opens its titles.
                </p>
              </div>
            )}

            {form.type === 'category' && (
              <div className="space-y-1.5">
                <Label>
                  Genre <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.genreId}
                  onValueChange={(v) => setForm({ ...form, genreId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {genres.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    <Tags className="size-3 inline mr-1" />
                    No active genres found.
                  </p>
                )}
              </div>
            )}

            {form.type === 'categories' && (
              <div className="space-y-1.5">
                <Label>
                  Genres <span className="text-destructive">*</span>
                </Label>
                <GenreSelect
                  value={form.genreIds}
                  onChange={(genreIds) => setForm({ ...form, genreIds })}
                />
                <p className="text-xs text-muted-foreground">
                  Each picked genre shows as a tile in this row — tapping one
                  opens its content.
                </p>
              </div>
            )}

            {form.type === 'all' && (
              <div className="space-y-1.5">
                <Label>
                  Sort by <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.sortBy}
                  onValueChange={(v) =>
                    setForm({ ...form, sortBy: v as HomeSectionSortBy })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_BY_OPTIONS.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Shows every published title, no genre/collection filter —
                  just ordered the way you pick here.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Trending Now"
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending ||
                  editMutation.isPending ||
                  !canSubmit
                }
              >
                {editing
                  ? editMutation.isPending
                    ? 'Saving…'
                    : 'Save changes'
                  : createMutation.isPending
                    ? 'Adding…'
                    : 'Add section'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
