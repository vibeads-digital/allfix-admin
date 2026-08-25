import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Tv, Clapperboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import {
  adminGetSeasons,
  adminGetEpisodes,
  createSeason,
  updateSeason,
  deleteSeason,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  attachExternalEpisodeVideo,
  deleteVideoSource,
  type ContentListItem,
  type Season,
  type AdminEpisode,
} from '@/lib/api/content';

const emptySeasonForm = {
  seasonNumber: '',
  title: '',
  description: '',
  releaseYear: '',
  posterUrl: '',
  bannerUrl: '',
  isActive: true,
};

const emptyEpisodeForm = {
  episodeNumber: '',
  title: '',
  description: '',
  durationMinutes: '',
  thumbnailUrl: '',
  airDate: '',
  isFree: false,
  isActive: true,
  mainVideoUrl: '',
  originalMainVideoUrl: '',
  mainVideoSourceId: null as number | null,
};

export function SeriesSeasonsDialog({
  series,
  onClose,
}: {
  series: ContentListItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  // The user's explicit pick — falls back to the first season below
  // whenever it doesn't refer to a season that's actually in the current
  // list (first load, a series swap, or the selected season got deleted).
  const [pickedSeasonId, setPickedSeasonId] = useState<number | null>(null);

  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonForm, setSeasonForm] = useState(emptySeasonForm);

  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<AdminEpisode | null>(
    null,
  );
  const [episodeForm, setEpisodeForm] = useState(emptyEpisodeForm);

  const seasonsQuery = useQuery({
    queryKey: ['content', 'admin-seasons', series?.id],
    queryFn: () => adminGetSeasons(series!.id),
    enabled: !!series,
  });
  const seasons = seasonsQuery.data ?? [];

  const selectedSeasonId = seasons.some((s) => s.id === pickedSeasonId)
    ? pickedSeasonId
    : seasons[0]?.id ?? null;

  const episodesQuery = useQuery({
    queryKey: ['content', 'admin-episodes', selectedSeasonId],
    queryFn: () => adminGetEpisodes(selectedSeasonId!),
    enabled: !!selectedSeasonId,
  });
  const episodes = episodesQuery.data ?? [];

  const invalidateSeasons = () =>
    queryClient.invalidateQueries({
      queryKey: ['content', 'admin-seasons', series?.id],
    });
  const invalidateEpisodes = () =>
    queryClient.invalidateQueries({
      queryKey: ['content', 'admin-episodes', selectedSeasonId],
    });

  // ─── Season mutations ───────────────────────────────────────────────────

  const createSeasonMutation = useMutation({
    mutationFn: () =>
      createSeason(series!.id, {
        seasonNumber: Number(seasonForm.seasonNumber),
        title: seasonForm.title || undefined,
        description: seasonForm.description || undefined,
        releaseYear: seasonForm.releaseYear
          ? Number(seasonForm.releaseYear)
          : undefined,
        posterUrl: seasonForm.posterUrl || undefined,
        bannerUrl: seasonForm.bannerUrl || undefined,
      }),
    onSuccess: ({ season }) => {
      toast.success('Season added');
      invalidateSeasons();
      setPickedSeasonId(season.id);
      closeSeasonDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateSeasonMutation = useMutation({
    mutationFn: () =>
      updateSeason(editingSeason!.id, {
        title: seasonForm.title || null,
        description: seasonForm.description || null,
        releaseYear: seasonForm.releaseYear
          ? Number(seasonForm.releaseYear)
          : null,
        posterUrl: seasonForm.posterUrl || null,
        bannerUrl: seasonForm.bannerUrl || null,
        isActive: seasonForm.isActive,
      }),
    onSuccess: () => {
      toast.success('Season updated');
      invalidateSeasons();
      closeSeasonDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: (id: number) => deleteSeason(id),
    onSuccess: () => {
      toast.success('Season deleted');
      invalidateSeasons();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Episode mutations ──────────────────────────────────────────────────

  const createEpisodeMutation = useMutation({
    mutationFn: async () => {
      const { episode } = await createEpisode(selectedSeasonId!, {
        episodeNumber: Number(episodeForm.episodeNumber),
        title: episodeForm.title,
        description: episodeForm.description || undefined,
        durationMinutes: episodeForm.durationMinutes
          ? Number(episodeForm.durationMinutes)
          : undefined,
        thumbnailUrl: episodeForm.thumbnailUrl || undefined,
        airDate: episodeForm.airDate || undefined,
        isFree: episodeForm.isFree,
      });
      if (episodeForm.mainVideoUrl) {
        await attachExternalEpisodeVideo(episode.id, {
          type: 'main',
          quality: 'hd',
          hlsUrl: episodeForm.mainVideoUrl,
        });
      }
      return episode;
    },
    onSuccess: () => {
      toast.success('Episode added');
      invalidateEpisodes();
      closeEpisodeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateEpisodeMutation = useMutation({
    mutationFn: async () => {
      const { episode } = await updateEpisode(editingEpisode!.id, {
        title: episodeForm.title,
        description: episodeForm.description || null,
        durationMinutes: episodeForm.durationMinutes
          ? Number(episodeForm.durationMinutes)
          : null,
        thumbnailUrl: episodeForm.thumbnailUrl || null,
        airDate: episodeForm.airDate || null,
        isFree: episodeForm.isFree,
        isActive: episodeForm.isActive,
      });
      if (
        episodeForm.mainVideoUrl &&
        episodeForm.mainVideoUrl !== episodeForm.originalMainVideoUrl
      ) {
        await attachExternalEpisodeVideo(editingEpisode!.id, {
          type: 'main',
          quality: 'hd',
          hlsUrl: episodeForm.mainVideoUrl,
        });
      } else if (!episodeForm.mainVideoUrl && episodeForm.mainVideoSourceId) {
        await deleteVideoSource(episodeForm.mainVideoSourceId);
      }
      return episode;
    },
    onSuccess: () => {
      toast.success('Episode updated');
      invalidateEpisodes();
      closeEpisodeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteEpisodeMutation = useMutation({
    mutationFn: (id: number) => deleteEpisode(id),
    onSuccess: () => {
      toast.success('Episode deleted');
      invalidateEpisodes();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ─── Season dialog helpers ──────────────────────────────────────────────

  const openCreateSeason = () => {
    setEditingSeason(null);
    setSeasonForm({
      ...emptySeasonForm,
      seasonNumber: String(seasons.length + 1),
    });
    setSeasonDialogOpen(true);
  };

  const openEditSeason = (season: Season) => {
    setEditingSeason(season);
    setSeasonForm({
      seasonNumber: String(season.seasonNumber),
      title: season.title ?? '',
      description: season.description ?? '',
      releaseYear: season.releaseYear ? String(season.releaseYear) : '',
      posterUrl: season.posterUrl ?? '',
      bannerUrl: season.bannerUrl ?? '',
      isActive: season.isActive,
    });
    setSeasonDialogOpen(true);
  };

  const closeSeasonDialog = () => {
    setSeasonDialogOpen(false);
    setEditingSeason(null);
    setSeasonForm(emptySeasonForm);
  };

  const handleSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSeason) updateSeasonMutation.mutate();
    else createSeasonMutation.mutate();
  };

  // ─── Episode dialog helpers ─────────────────────────────────────────────

  const openCreateEpisode = () => {
    setEditingEpisode(null);
    setEpisodeForm({
      ...emptyEpisodeForm,
      episodeNumber: String(episodes.length + 1),
    });
    setEpisodeDialogOpen(true);
  };

  const openEditEpisode = (episode: AdminEpisode) => {
    setEditingEpisode(episode);
    setEpisodeForm({
      episodeNumber: String(episode.episodeNumber),
      title: episode.title,
      description: episode.description ?? '',
      durationMinutes: episode.durationMinutes
        ? String(episode.durationMinutes)
        : '',
      thumbnailUrl: episode.thumbnailUrl ?? '',
      airDate: episode.airDate ?? '',
      isFree: episode.isFree,
      isActive: episode.isActive,
      mainVideoUrl: episode.mainVideoUrl ?? '',
      originalMainVideoUrl: episode.mainVideoUrl ?? '',
      mainVideoSourceId: episode.mainVideoSourceId,
    });
    setEpisodeDialogOpen(true);
  };

  const closeEpisodeDialog = () => {
    setEpisodeDialogOpen(false);
    setEditingEpisode(null);
    setEpisodeForm(emptyEpisodeForm);
  };

  const handleEpisodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!episodeForm.title.trim()) {
      toast.error('Episode title is required.');
      return;
    }
    if (editingEpisode) updateEpisodeMutation.mutate();
    else createEpisodeMutation.mutate();
  };

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId) ?? null;

  return (
    <>
      <Dialog open={!!series} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seasons — {series?.title}</DialogTitle>
            <DialogDescription>
              Manage seasons and episodes for this show.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4">
            {/* Seasons sidebar */}
            <div className="w-44 shrink-0 space-y-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full"
                onClick={openCreateSeason}
              >
                <Plus className="size-3.5 mr-1" />
                Add season
              </Button>
              {seasonsQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : seasons.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No seasons yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {seasons.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        'group flex items-center gap-0.5 rounded-md pl-2.5 pr-1 py-1.5 cursor-pointer text-sm',
                        s.id === selectedSeasonId
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted',
                      )}
                      onClick={() => setPickedSeasonId(s.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          Season {s.seasonNumber}
                          {!s.isActive && (
                            <span className="text-muted-foreground">
                              {' '}
                              (inactive)
                            </span>
                          )}
                        </div>
                        {s.title && (
                          <div className="text-xs text-muted-foreground truncate">
                            {s.title}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditSeason(s);
                        }}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100 shrink-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `Delete Season ${s.seasonNumber}? This also deletes its episodes.`,
                            )
                          ) {
                            deleteSeasonMutation.mutate(s.id);
                          }
                        }}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Episodes panel */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs mb-0">
                  {selectedSeason
                    ? `Season ${selectedSeason.seasonNumber} episodes`
                    : 'Episodes'}
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!selectedSeasonId}
                  onClick={openCreateEpisode}
                >
                  <Plus className="size-3.5 mr-1" />
                  Add episode
                </Button>
              </div>

              {!selectedSeasonId ? (
                <p className="text-xs text-muted-foreground">
                  Pick or add a season first.
                </p>
              ) : episodesQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading…</p>
              ) : episodes.length === 0 ? (
                <EmptyState
                  icon={Clapperboard}
                  title="No episodes yet"
                  description="Add the first episode to this season."
                />
              ) : (
                <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center gap-3 rounded-md border border-border p-2"
                    >
                      {ep.thumbnailUrl ? (
                        <img
                          src={ep.thumbnailUrl}
                          alt=""
                          className="h-9 w-14 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-14 rounded bg-muted shrink-0 grid place-items-center">
                          <Tv className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {ep.episodeNumber}. {ep.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                          <span>
                            {ep.durationMinutes
                              ? `${ep.durationMinutes}m`
                              : '—'}
                          </span>
                          {ep.airDate && <span>· {ep.airDate}</span>}
                          {ep.isFree && (
                            <Badge variant="secondary">Free</Badge>
                          )}
                          {!ep.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                          {!ep.mainVideoUrl && (
                            <Badge
                              variant="outline"
                              className="text-destructive border-destructive/30"
                            >
                              No video
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7"
                          aria-label="Edit episode"
                          onClick={() => openEditEpisode(ep)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          aria-label="Delete episode"
                          onClick={() => deleteEpisodeMutation.mutate(ep.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Season editor */}
      <Dialog
        open={seasonDialogOpen}
        onOpenChange={(open) => !open && closeSeasonDialog()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSeason
                ? `Edit Season ${editingSeason.seasonNumber}`
                : 'Add season'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSeasonSubmit} className="space-y-3">
            {!editingSeason && (
              <div>
                <Label>
                  Season number <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={seasonForm.seasonNumber}
                  onChange={(e) =>
                    setSeasonForm({
                      ...seasonForm,
                      seasonNumber: e.target.value,
                    })
                  }
                  className="mt-1.5"
                  required
                />
              </div>
            )}
            <div>
              <Label>Title</Label>
              <Input
                value={seasonForm.title}
                onChange={(e) =>
                  setSeasonForm({ ...seasonForm, title: e.target.value })
                }
                placeholder="e.g. Chapter One"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={seasonForm.description}
                onChange={(e) =>
                  setSeasonForm({
                    ...seasonForm,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Release year</Label>
              <Input
                type="number"
                value={seasonForm.releaseYear}
                onChange={(e) =>
                  setSeasonForm({
                    ...seasonForm,
                    releaseYear: e.target.value,
                  })
                }
                placeholder="2026"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Poster URL</Label>
                <Input
                  value={seasonForm.posterUrl}
                  onChange={(e) =>
                    setSeasonForm({ ...seasonForm, posterUrl: e.target.value })
                  }
                  placeholder="https://…"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-xs">Banner URL</Label>
                <Input
                  value={seasonForm.bannerUrl}
                  onChange={(e) =>
                    setSeasonForm({ ...seasonForm, bannerUrl: e.target.value })
                  }
                  placeholder="https://…"
                  className="mt-1.5"
                />
              </div>
            </div>
            {editingSeason && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch
                  checked={seasonForm.isActive}
                  onCheckedChange={(v) =>
                    setSeasonForm({ ...seasonForm, isActive: v })
                  }
                />
                Active
              </label>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeSeasonDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createSeasonMutation.isPending ||
                  updateSeasonMutation.isPending
                }
              >
                {editingSeason ? 'Save changes' : 'Add season'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Episode editor */}
      <Dialog
        open={episodeDialogOpen}
        onOpenChange={(open) => !open && closeEpisodeDialog()}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEpisode
                ? `Edit Episode ${editingEpisode.episodeNumber}`
                : 'Add episode'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEpisodeSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {!editingEpisode && (
                <div>
                  <Label>
                    Episode number{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={episodeForm.episodeNumber}
                    onChange={(e) =>
                      setEpisodeForm({
                        ...episodeForm,
                        episodeNumber: e.target.value,
                      })
                    }
                    className="mt-1.5"
                    required
                  />
                </div>
              )}
              <div className={editingEpisode ? 'col-span-2' : ''}>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={episodeForm.durationMinutes}
                  onChange={(e) =>
                    setEpisodeForm({
                      ...episodeForm,
                      durationMinutes: e.target.value,
                    })
                  }
                  placeholder="42"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={episodeForm.title}
                onChange={(e) =>
                  setEpisodeForm({ ...episodeForm, title: e.target.value })
                }
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={episodeForm.description}
                onChange={(e) =>
                  setEpisodeForm({
                    ...episodeForm,
                    description: e.target.value,
                  })
                }
                rows={2}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Air date</Label>
              <Input
                type="date"
                value={episodeForm.airDate}
                onChange={(e) =>
                  setEpisodeForm({ ...episodeForm, airDate: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs">Thumbnail URL</Label>
              <Input
                value={episodeForm.thumbnailUrl}
                onChange={(e) =>
                  setEpisodeForm({
                    ...episodeForm,
                    thumbnailUrl: e.target.value,
                  })
                }
                placeholder="https://…"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Video URL</Label>
              <Input
                value={episodeForm.mainVideoUrl}
                onChange={(e) =>
                  setEpisodeForm({
                    ...episodeForm,
                    mainVideoUrl: e.target.value,
                  })
                }
                placeholder="https://…"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Switch
                  checked={episodeForm.isFree}
                  onCheckedChange={(v) =>
                    setEpisodeForm({ ...episodeForm, isFree: v })
                  }
                />
                Free
              </label>
              {editingEpisode && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Switch
                    checked={episodeForm.isActive}
                    onCheckedChange={(v) =>
                      setEpisodeForm({ ...episodeForm, isActive: v })
                    }
                  />
                  Active
                </label>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeEpisodeDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createEpisodeMutation.isPending ||
                  updateEpisodeMutation.isPending
                }
              >
                {editingEpisode ? 'Save changes' : 'Add episode'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
