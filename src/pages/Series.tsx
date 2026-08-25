import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Pencil,
  Trash2,
  Tv,
  Eye,
  Layers,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GenreSelect } from '@/components/common/GenreSelect';
import { LanguageSelect } from '@/components/common/LanguageSelect';
import { CastManager, type CastEntry } from '@/components/common/CastManager';
import { SeriesViewDialog } from '@/components/common/SeriesViewDialog';
import { SeriesSeasonsDialog } from '@/components/common/SeriesSeasonsDialog';
import { usePageSearch } from '@/store/topbar-search';
import { cn } from '@/lib/utils';
import { getGenres } from '@/lib/api/genre';
import { getLanguages } from '@/lib/api/language';

import {
  addContentCast,
  adminGetContent,
  adminListContent,
  attachExternalContentVideo,
  createContent,
  deleteContent,
  deleteVideoSource,
  removeContentCast,
  setContentLanguages,
  setContentGenres,
  setContentStatus,
  updateContent,
  type ContentListItem,
  type ContentLanguageLink,
  type ContentStatus,
} from '@/lib/api/content';

const SERIES_KEY = ['content', 'series'] as const;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'createdAt:desc', label: 'Recently added' },
  { value: 'createdAt:asc', label: 'Oldest added' },
  { value: 'title:asc', label: 'Title (A-Z)' },
  { value: 'title:desc', label: 'Title (Z-A)' },
  { value: 'releaseYear:desc', label: 'Release year (newest)' },
  { value: 'releaseYear:asc', label: 'Release year (oldest)' },
];

const emptyForm = {
  title: '',
  description: '',
  releaseYear: '',
  ageRating: '',
  posterUrl: '',
  bannerUrl: '',
  thumbnailUrl: '',
  logoUrl: '',
  trailerUrl: '',
  originalTrailerUrl: '',
  trailerVideoSourceId: null as number | null,
  genreIds: [] as number[],
  languages: [] as ContentLanguageLink[],
  cast: [] as CastEntry[],
  originalCastIds: [] as number[],
  isFree: false,
  isFeatured: false,
  isNewRelease: false,
  isComingSoon: false,
};

export function SeriesPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [viewingShow, setViewingShow] = useState<ContentListItem | null>(null);
  const [managingSeasons, setManagingSeasons] =
    useState<ContentListItem | null>(null);
  const [q, setQ] = useState(
    () => (location.state as { q?: string } | null)?.q ?? '',
  );
  const [status, setStatus] = useState<ContentStatus | 'all'>('all');
  const [genreId, setGenreId] = useState<number | 'all'>('all');
  const [languageId, setLanguageId] = useState<number | 'all'>('all');
  const [sort, setSort] = useState('createdAt:desc');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  usePageSearch('Search shows by title…', q, (v) => {
    setQ(v);
    setPage(1);
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentListItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const pageSize = 10;

  const [orderBy, order] = sort.split(':') as [
    'createdAt' | 'releaseYear' | 'title',
    'asc' | 'desc',
  ];

  const { data, isLoading } = useQuery({
    queryKey: [...SERIES_KEY, status, genreId, languageId, sort, q, page],
    queryFn: () =>
      adminListContent({
        type: 'series',
        status,
        genreId: genreId === 'all' ? undefined : genreId,
        languageId: languageId === 'all' ? undefined : languageId,
        order,
        orderBy,
        search: q || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });

  const genresQuery = useQuery({
    queryKey: ['genres', 'all'],
    queryFn: () => getGenres({ limit: 100, status: 'active' }),
  });
  const languagesQuery = useQuery({
    queryKey: ['languages', 'all'],
    queryFn: () => getLanguages({ limit: 100, status: 'active' }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SERIES_KEY });

  // Cast is staged in `form.cast` just like genres/languages — newly added
  // rows get a "new-…" key (no real castId yet), so the diff against
  // `form.originalCastIds` tells us what to add/remove on save.
  const commitCastChanges = async (contentId: number) => {
    const toAdd = form.cast.filter((c) => c.key.startsWith('new-'));
    const keptRealKeys = new Set(
      form.cast.filter((c) => !c.key.startsWith('new-')).map((c) => c.key),
    );
    const toRemove = form.originalCastIds.filter(
      (id) => !keptRealKeys.has(String(id)),
    );
    await Promise.all([
      ...toAdd.map((c) =>
        addContentCast(contentId, {
          personId: c.personId,
          roleId: c.roleId,
          characterName: c.characterName ?? undefined,
        }),
      ),
      ...toRemove.map((id) => removeContentCast(id)),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { content } = await createContent({
        title: form.title,
        type: 'series',
        description: form.description || undefined,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        ageRating: form.ageRating || undefined,
        posterUrl: form.posterUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        logoUrl: form.logoUrl || undefined,
        isFree: form.isFree,
        isFeatured: form.isFeatured,
        isNewRelease: form.isNewRelease,
        isComingSoon: form.isComingSoon,
      });
      await Promise.all([
        form.trailerUrl
          ? attachExternalContentVideo(content.id, {
              type: 'trailer',
              quality: 'hd',
              hlsUrl: form.trailerUrl,
            })
          : null,
        form.genreIds.length
          ? setContentGenres(content.id, form.genreIds)
          : null,
        form.languages.length
          ? setContentLanguages(content.id, form.languages)
          : null,
        commitCastChanges(content.id),
      ]);
      return content;
    },
    onSuccess: () => {
      toast.success('Show created');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { content } = await updateContent(editing!.id, {
        title: form.title,
        description: form.description || undefined,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
        ageRating: form.ageRating || undefined,
        posterUrl: form.posterUrl || undefined,
        bannerUrl: form.bannerUrl || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        logoUrl: form.logoUrl || null,
        isFree: form.isFree,
        isFeatured: form.isFeatured,
        isNewRelease: form.isNewRelease,
        isComingSoon: form.isComingSoon,
      });
      await Promise.all([
        form.trailerUrl && form.trailerUrl !== form.originalTrailerUrl
          ? attachExternalContentVideo(editing!.id, {
              type: 'trailer',
              quality: 'hd',
              hlsUrl: form.trailerUrl,
            })
          : !form.trailerUrl && form.trailerVideoSourceId
            ? deleteVideoSource(form.trailerVideoSourceId)
            : null,
        form.genreIds.length
          ? setContentGenres(editing!.id, form.genreIds)
          : null,
        form.languages.length
          ? setContentLanguages(editing!.id, form.languages)
          : null,
        commitCastChanges(editing!.id),
      ]);
      return content;
    },
    onSuccess: () => {
      toast.success('Show updated');
      invalidate();
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: ContentStatus }) =>
      setContentStatus(id, next),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContent(id),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const bulkSetStatus = async (next: ContentStatus) => {
    await Promise.all(
      Array.from(selected).map((id) => setContentStatus(id, next)),
    );
    toast.success(`Updated ${selected.size} shows`);
    setSelected(new Set());
    invalidate();
  };

  const bulkDelete = async () => {
    await Promise.all(Array.from(selected).map((id) => deleteContent(id)));
    toast.success(`Deleted ${selected.size} shows`);
    setSelected(new Set());
    invalidate();
  };

  const shows = data?.contents ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const allSelected =
    shows.length > 0 && shows.every((m) => selected.has(m.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) shows.forEach((m) => next.delete(m.id));
    else shows.forEach((m) => next.add(m.id));
    setSelected(next);
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setStep(1);
    setDialogOpen(true);
  };

  const openEdit = async (show: ContentListItem) => {
    setEditing(show);
    setStep(1);
    // The list row is lightweight and omits description — fetch the full
    // record so editing doesn't silently wipe it out.
    const detail = await adminGetContent(show.id).catch(() => null);
    setForm({
      title: show.title,
      description: detail?.description ?? '',
      releaseYear: show.releaseYear ? String(show.releaseYear) : '',
      ageRating: show.ageRating ?? '',
      posterUrl: show.posterUrl ?? '',
      bannerUrl: show.bannerUrl ?? '',
      thumbnailUrl: show.thumbnailUrl ?? '',
      logoUrl: detail?.logoUrl ?? '',
      trailerUrl: detail?.trailerUrl ?? '',
      originalTrailerUrl: detail?.trailerUrl ?? '',
      trailerVideoSourceId: detail?.trailerVideoSourceId ?? null,
      genreIds: detail?.genreIds ?? [],
      languages: detail?.languages ?? [],
      cast: (detail?.cast ?? []).map((c) => ({
        key: String(c.id),
        personId: c.personId,
        personName: c.personName,
        roleId: c.roleId,
        roleName: c.roleName,
        characterName: c.characterName,
      })),
      originalCastIds: (detail?.cast ?? []).map((c) => c.id),
      isFree: show.isFree,
      isFeatured: show.isFeatured,
      isNewRelease: show.isNewRelease,
      isComingSoon: show.isComingSoon,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setStep(1);
  };

  const validateForm = (): string | null => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.description.trim()) return 'Description is required.';
    if (!form.ageRating) return 'Age rating is required.';
    if (!form.posterUrl) return 'Poster image is required.';
    if (!form.bannerUrl) return 'Banner image is required.';
    if (!form.thumbnailUrl) return 'Thumbnail image is required.';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      const error = validateForm();
      if (error) {
        toast.error(error);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <PageHeader
        title="Web Series"
        description={`${total} show${total === 1 ? '' : 's'}`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-2" />
            Add Show
          </Button>
        }
      />

      <Card className="p-4 mb-4 gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as ContentStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <Filter className="size-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(genreId)}
            onValueChange={(v) => {
              setGenreId(v === 'all' ? 'all' : Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All genres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genres</SelectItem>
              {genresQuery.data?.genres.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(languageId)}
            onValueChange={(v) => {
              setLanguageId(v === 'all' ? 'all' : Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="All languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {languagesQuery.data?.languages.map((l) => (
                <SelectItem key={l.id} value={String(l.id)}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[180px]">
              <ArrowUpDown className="size-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto inline-flex rounded-md border border-border p-0.5">
            <button
              onClick={() => setView('table')}
              aria-label="Table view"
              className={cn(
                'size-7 grid place-items-center rounded',
                view === 'table' && 'bg-muted',
              )}
            >
              <ListIcon className="size-3.5" />
            </button>
            <button
              onClick={() => setView('grid')}
              aria-label="Grid view"
              className={cn(
                'size-7 grid place-items-center rounded',
                view === 'grid' && 'bg-muted',
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 p-2 mt-2 rounded-md bg-primary/10 border border-primary/20 text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => bulkSetStatus('draft')}
            >
              Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkSetStatus('published')}
            >
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkSetStatus('archived')}
            >
              Archive
            </Button>
            <Button variant="destructive" size="sm" onClick={bulkDelete}>
              <Trash2 className="size-3.5 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">
          Loading…
        </div>
      ) : shows.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="No shows yet"
          description="Add your first show to get started."
        />
      ) : view === 'table' ? (
        <Card className="overflow-hidden p-0 gap-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3 w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th className="px-2 py-3">Title</th>
                  <th className="px-2 py-3">Category</th>
                  <th className="px-2 py-3">Release</th>
                  <th className="px-2 py-3">Rating</th>
                  <th className="px-2 py-3">Languages</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => toggleOne(m.id)}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {m.thumbnailUrl ? (
                          <img
                            src={m.thumbnailUrl}
                            alt=""
                            className="h-9 w-14 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-14 rounded bg-muted shrink-0 grid place-items-center">
                            <Tv className="size-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium truncate">{m.title}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground truncate max-w-[140px]">
                      {m.genreNames ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground tabular-nums">
                      {m.releaseYear ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {m.ageRating ?? '—'}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground truncate max-w-[140px]">
                      {m.languageNames ?? '—'}
                    </td>
                    <td className="px-2 py-3">
                      <Select
                        value={m.status}
                        onValueChange={(v) =>
                          statusMutation.mutate({
                            id: m.id,
                            next: v as ContentStatus,
                          })
                        }
                      >
                        <SelectTrigger
                          className={cn(
                            'h-7 w-[110px] text-xs',
                            m.status === 'published' &&
                              'border-success/30 bg-success/10 text-success',
                            m.status === 'archived' &&
                              'border-border bg-muted text-muted-foreground',
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          aria-label="View"
                          onClick={() => setViewingShow(m)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          aria-label="Seasons"
                          onClick={() => setManagingSeasons(m)}
                        >
                          <Layers className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          aria-label="Edit"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          aria-label="Delete"
                          onClick={() => deleteMutation.mutate(m.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-3 border-t border-border text-xs text-muted-foreground">
            <span>
              Showing {shows.length} of {total}
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
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
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
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {shows.map((m) => (
            <Card
              key={m.id}
              onClick={() => setViewingShow(m)}
              className="group overflow-hidden p-0 gap-0 cursor-pointer border-border/60 bg-card shadow-sm hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="aspect-video overflow-hidden bg-muted relative">
                {m.thumbnailUrl ? (
                  <img
                    src={m.thumbnailUrl}
                    alt={m.title}
                    className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="size-full grid place-items-center bg-gradient-to-br from-muted to-muted/50">
                    <Tv className="size-7 text-muted-foreground/60" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3.5 space-y-2">
                <div className="font-medium text-sm leading-snug truncate group-hover:text-primary transition-colors">
                  {m.title}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {m.genreNames ?? '—'}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{m.releaseYear ?? '—'}</span>
                  <span>·</span>
                  <span>{m.ageRating ?? '—'}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {m.languageNames ?? '—'}
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={m.status}
                    onValueChange={(v) =>
                      statusMutation.mutate({
                        id: m.id,
                        next: v as ContentStatus,
                      })
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        'h-7 w-full text-xs',
                        m.status === 'published' &&
                          'border-success/30 bg-success/10 text-success',
                        m.status === 'archived' &&
                          'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label="View"
                    onClick={() => setViewingShow(m)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label="Seasons"
                    onClick={() => setManagingSeasons(m)}
                  >
                    <Layers className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label="Edit"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    aria-label="Delete"
                    onClick={() => deleteMutation.mutate(m.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── REDESIGNED DIALOG (matches MoviesPage layout) ── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        {/*
          KEY CHANGES vs original:
          - max-w-4xl  → wider so content lays out horizontally
          - flex flex-col + max-h-[90vh] → caps total height at 90% of viewport
          - overflow-y-auto on the form area → content scrolls inside, header/footer stay fixed
        */}
        <DialogContent className="max-w-4xl w-full flex flex-col max-h-[90vh] p-0 gap-0">
          {/* ── Fixed header ── */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <DialogTitle>
              {editing ? `Edit ${editing.title}` : 'Add new show'}
            </DialogTitle>
            <DialogDescription className="mt-0.5">
              {step === 1
                ? 'Step 1 of 3 — basic details'
                : step === 2
                  ? 'Step 2 of 3 — flags, genres, languages & cast'
                  : 'Step 3 of 3 — logo and trailer'}
            </DialogDescription>

            {/* Step indicator dots */}
            <div className="flex items-center gap-2 mt-3">
              {([1, 2, 3] as const).map((s) => (
                <div
                  key={s}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    s === step
                      ? 'w-6 bg-primary'
                      : s < step
                        ? 'w-4 bg-primary/40'
                        : 'w-4 bg-muted',
                  )}
                />
              ))}
            </div>
          </DialogHeader>

          {/* ── Scrollable form body ── */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* ══ STEP 1 ══ */}
              {step === 1 && (
                <div className="flex gap-6">
                  {/* Left column — text fields */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <div>
                      <Label className="text-xs font-medium">
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        placeholder="e.g. Neon Shadows"
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-medium">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        rows={4}
                        placeholder="Synopsis…"
                        className="mt-1.5 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">
                          Release year
                        </Label>
                        <Input
                          type="number"
                          value={form.releaseYear}
                          onChange={(e) =>
                            setForm({ ...form, releaseYear: e.target.value })
                          }
                          placeholder="2026"
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">
                          Age rating <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={form.ageRating}
                          onValueChange={(v) =>
                            setForm({ ...form, ageRating: v })
                          }
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {['U', 'U/A 7+', 'U/A 13+', 'U/A 16+', 'A'].map(
                              (g) => (
                                <SelectItem key={g} value={g}>
                                  {g}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Right column — image URLs */}
                  <div className="w-[260px] shrink-0 flex flex-col gap-3">
                    <div>
                      <Label className="text-xs font-medium">
                        Poster URL <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.posterUrl}
                        onChange={(e) =>
                          setForm({ ...form, posterUrl: e.target.value })
                        }
                        placeholder="https://…"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        Banner URL <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.bannerUrl}
                        onChange={(e) =>
                          setForm({ ...form, bannerUrl: e.target.value })
                        }
                        placeholder="https://…"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">
                        Thumbnail URL{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.thumbnailUrl}
                        onChange={(e) =>
                          setForm({ ...form, thumbnailUrl: e.target.value })
                        }
                        placeholder="https://…"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══ STEP 2 ══ */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Flags row */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Flags
                    </Label>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.isFree}
                          onCheckedChange={(v) =>
                            setForm({ ...form, isFree: !!v })
                          }
                        />
                        Free (no subscription required)
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.isFeatured}
                          onCheckedChange={(v) =>
                            setForm({ ...form, isFeatured: !!v })
                          }
                        />
                        Featured on homepage
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.isNewRelease}
                          onCheckedChange={(v) =>
                            setForm({ ...form, isNewRelease: !!v })
                          }
                        />
                        New release
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={form.isComingSoon}
                          onCheckedChange={(v) =>
                            setForm({ ...form, isComingSoon: !!v })
                          }
                        />
                        Coming soon
                      </label>
                    </div>
                  </div>

                  {/* Genres + Languages side by side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium">Genres</Label>
                      <div className="mt-1.5">
                        <GenreSelect
                          value={form.genreIds}
                          onChange={(genreIds) =>
                            setForm({ ...form, genreIds })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Languages</Label>
                      <div className="mt-1.5">
                        <LanguageSelect
                          value={form.languages}
                          onChange={(languages) =>
                            setForm({ ...form, languages })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cast full-width */}
                  <div>
                    <Label className="text-xs font-medium">Cast & crew</Label>
                    <div className="mt-1.5">
                      <CastManager
                        cast={form.cast}
                        onAdd={(entry) =>
                          setForm({
                            ...form,
                            cast: [
                              ...form.cast,
                              { ...entry, key: `new-${crypto.randomUUID()}` },
                            ],
                          })
                        }
                        onRemove={(key) =>
                          setForm({
                            ...form,
                            cast: form.cast.filter((c) => c.key !== key),
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ══ STEP 3 ══ */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Logo */}
                  <div className="w-[260px]">
                    <Label className="text-xs font-medium">
                      Logo URL{' '}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={form.logoUrl}
                      onChange={(e) =>
                        setForm({ ...form, logoUrl: e.target.value })
                      }
                      placeholder="https://…"
                      className="mt-1.5"
                    />
                  </div>

                  {/* Trailer */}
                  <div className="w-[260px]">
                    <Label className="text-xs font-medium mb-1.5 block">
                      Trailer URL{' '}
                      <span className="text-muted-foreground font-normal">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      value={form.trailerUrl}
                      onChange={(e) =>
                        setForm({ ...form, trailerUrl: e.target.value })
                      }
                      placeholder="https://…"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Fixed footer ── */}
            <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
              {step === 1 ? (
                <>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">Next →</Button>
                </>
              ) : step === 2 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    ← Back
                  </Button>
                  <Button type="submit">Next →</Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                  >
                    ← Back
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? 'Saving…'
                      : editing
                        ? 'Save changes'
                        : 'Create show'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SeriesViewDialog
        series={viewingShow}
        onClose={() => setViewingShow(null)}
      />

      <SeriesSeasonsDialog
        series={managingSeasons}
        onClose={() => setManagingSeasons(null)}
      />
    </>
  );
}
