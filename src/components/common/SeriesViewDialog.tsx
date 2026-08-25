import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Star, CalendarDays, ShieldCheck, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { VideoPlayerDialog } from '@/components/common/VideoPlayerDialog';
import {
  adminGetContent,
  type ContentListItem,
  type ContentStatus,
} from '@/lib/api/content';
import { getGenres } from '@/lib/api/genre';
import { getLanguages } from '@/lib/api/language';

const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
      {children}
    </div>
  );
}

export function SeriesViewDialog({
  series,
  onClose,
}: {
  series: ContentListItem | null;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<{
    title: string;
    hlsUrl: string;
  } | null>(null);

  const detailQuery = useQuery({
    queryKey: ['content', 'detail', series?.id],
    queryFn: () => adminGetContent(series!.id),
    enabled: !!series,
  });
  const genresQuery = useQuery({
    queryKey: ['genres', 'all'],
    queryFn: () => getGenres({ limit: 100 }),
  });
  const languagesQuery = useQuery({
    queryKey: ['languages', 'all'],
    queryFn: () => getLanguages({ limit: 100 }),
  });

  const detail = detailQuery.data;
  const genreNames = (detail?.genreIds ?? [])
    .map((id) => genresQuery.data?.genres.find((g) => g.id === id)?.name)
    .filter((n): n is string => !!n);
  const languageEntries = (detail?.languages ?? [])
    .map((l) => ({
      name: languagesQuery.data?.languages.find(
        (lang) => lang.id === l.languageId,
      )?.name,
      isPrimary: l.isPrimary,
    }))
    .filter((l): l is { name: string; isPrimary: boolean } => !!l.name);

  return (
    <>
      <Dialog open={!!series} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
          {series && (
            <div className="flex gap-4">
              {/* Left: Banner / Thumbnail / Logo, stacked */}
              <div className="w-44 shrink-0 space-y-3">
                <div>
                  <SectionLabel>Banner</SectionLabel>
                  {series.bannerUrl ? (
                    <img
                      src={series.bannerUrl}
                      alt=""
                      className="w-full aspect-video object-cover rounded-md border border-border"
                    />
                  ) : (
                    <div className="w-full aspect-video rounded-md bg-muted border border-border grid place-items-center text-[10px] text-muted-foreground">
                      None
                    </div>
                  )}
                </div>
                <div>
                  <SectionLabel>Thumbnail</SectionLabel>
                  {series.thumbnailUrl ? (
                    <img
                      src={series.thumbnailUrl}
                      alt=""
                      className="w-full aspect-video object-cover rounded-md border border-border"
                    />
                  ) : (
                    <div className="w-full aspect-video rounded-md bg-muted border border-border grid place-items-center text-[10px] text-muted-foreground">
                      None
                    </div>
                  )}
                </div>
                <div>
                  <SectionLabel>Logo</SectionLabel>
                  {detail?.logoUrl ? (
                    <img
                      src={detail.logoUrl}
                      alt=""
                      className="w-full aspect-video object-contain rounded-md bg-muted border border-border p-1.5"
                    />
                  ) : (
                    <div className="w-full aspect-video rounded-md bg-muted border border-border grid place-items-center text-[10px] text-muted-foreground">
                      None
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Poster beside title/badges/actions/facts, then
                  description/genres/languages/cast spanning the full width. */}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex gap-4">
                  <div className="w-28 shrink-0">
                    <SectionLabel>Poster</SectionLabel>
                    {series.posterUrl ? (
                      <img
                        src={series.posterUrl}
                        alt=""
                        className="w-full aspect-[2/3] object-cover rounded-md border border-border"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] rounded-md bg-muted border border-border grid place-items-center text-[10px] text-muted-foreground">
                        None
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Title + flags */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="gap-1.5">
                          <span
                            className={cn(
                              'size-1.5 rounded-full shrink-0',
                              series.status === 'published' &&
                                'bg-emerald-500',
                              series.status === 'draft' && 'bg-amber-500',
                              series.status === 'archived' && 'bg-gray-400',
                            )}
                          />
                          {STATUS_LABEL[series.status]}
                        </Badge>
                        {series.isFeatured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {series.isNewRelease && (
                          <Badge variant="secondary">New Release</Badge>
                        )}
                        {series.isComingSoon && (
                          <Badge variant="secondary">Coming Soon</Badge>
                        )}
                        {series.isFree && (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </div>
                      <DialogTitle className="text-lg leading-tight truncate">
                        {series.title}
                      </DialogTitle>
                    </div>

                    {/* Actions */}
                    {detail?.trailerUrl && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPreview({
                              title: `${series.title} (trailer)`,
                              hlsUrl: detail.trailerUrl!,
                            })
                          }
                        >
                          <Play className="size-3.5" />
                          Trailer
                        </Button>
                      </div>
                    )}

                    {/* Quick facts */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {series.releaseYear ?? '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {series.ageRating ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {detail?.description && (
                  <div>
                    <SectionLabel>Description</SectionLabel>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {detail.description}
                    </p>
                  </div>
                )}

                {/* Genres + Languages */}
                {(genreNames.length > 0 || languageEntries.length > 0) && (
                  <div className="grid grid-cols-2 gap-3">
                    {genreNames.length > 0 && (
                      <div>
                        <SectionLabel>Genres</SectionLabel>
                        <div className="flex flex-wrap gap-1">
                          {genreNames.map((n) => (
                            <Badge key={n} variant="secondary">
                              {n}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {languageEntries.length > 0 && (
                      <div>
                        <SectionLabel>Languages</SectionLabel>
                        <div className="flex flex-wrap gap-1">
                          {languageEntries.map((l) => (
                            <Badge
                              key={l.name}
                              variant="secondary"
                              className="gap-1"
                            >
                              {l.name}
                              {l.isPrimary && (
                                <Star className="size-2.5 fill-amber-400 text-amber-400" />
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cast & Crew */}
                {(detail?.cast?.length ?? 0) > 0 && (
                  <div>
                    <SectionLabel>
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3" />
                        Cast & Crew
                      </span>
                    </SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {detail?.cast?.map((c) => (
                        <div
                          key={c.id}
                          className="bg-muted rounded-full pl-1 pr-3 py-1 flex items-center gap-2"
                        >
                          {c.personPhotoUrl ? (
                            <img
                              src={c.personPhotoUrl}
                              alt=""
                              className="size-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="size-6 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shrink-0">
                              {initials(c.personName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-medium leading-tight truncate">
                              {c.personName}
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-tight truncate">
                              {c.roleName}
                              {c.characterName && ` · as ${c.characterName}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VideoPlayerDialog video={preview} onClose={() => setPreview(null)} />
    </>
  );
}
