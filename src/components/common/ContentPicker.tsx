import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Film, Search, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadMoreSentinel } from "@/components/common/LoadMoreSentinel";
import { adminListContent, type ContentListItem, type ContentType } from "@/lib/api/content";

const PAGE_SIZE = 24;

// Lets the admin search and pick a movie/series by title+poster instead of
// typing a raw content id — mirrors StreamVideoPicker's "search a library,
// click to pick" pattern.
export function ContentPicker({
  value,
  onChange,
  typeFilter = "all",
  placeholder = "Choose a title…",
}: {
  value: ContentListItem | null;
  onChange: (content: ContentListItem | null) => void;
  typeFilter?: ContentType | "all";
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const query = useInfiniteQuery({
    queryKey: ["content-picker", typeFilter, search],
    queryFn: ({ pageParam }) =>
      adminListContent({
        type: typeFilter,
        search: search.trim() || undefined,
        limit: PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.contents.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    enabled: open,
  });
  const items = query.data?.pages.flatMap((p) => p.contents) ?? [];

  return (
    <>
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
          <div className="size-8 rounded overflow-hidden bg-muted shrink-0 grid place-items-center">
            {value.posterUrl || value.thumbnailUrl ? (
              <img src={value.posterUrl ?? value.thumbnailUrl ?? undefined} alt="" className="size-full object-cover" />
            ) : value.type === "movie" ? (
              <Film className="size-3.5 text-muted-foreground" />
            ) : (
              <Tv className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <span className="flex-1 text-sm truncate">{value.title}</span>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setOpen(true)}>
            Change
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => onChange(null)}>
            Clear
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-9 px-3 rounded-md border border-dashed border-input bg-muted/30 hover:bg-muted/50 transition-colors text-sm text-muted-foreground flex items-center gap-2"
        >
          <Search className="size-3.5 shrink-0" />
          <span className="truncate">{placeholder}</span>
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a title</DialogTitle>
          </DialogHeader>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="h-9"
            autoFocus
          />
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No titles found.</p>
          ) : (
            <div className="max-h-96 overflow-y-auto p-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onChange(c);
                      setOpen(false);
                      setSearch("");
                    }}
                    className="text-left rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-primary transition-all"
                  >
                    <div className="aspect-[2/3] bg-muted relative grid place-items-center">
                      {c.posterUrl || c.thumbnailUrl ? (
                        <img src={c.posterUrl ?? c.thumbnailUrl ?? undefined} alt="" className="absolute inset-0 size-full object-cover" />
                      ) : c.type === "movie" ? (
                        <Film className="size-5 text-muted-foreground" />
                      ) : (
                        <Tv className="size-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-1.5">
                      <div className="text-xs font-medium truncate" title={c.title}>
                        {c.title}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {c.type === "movie" ? "Movie" : "Series"}
                        {c.releaseYear ? ` · ${c.releaseYear}` : ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <LoadMoreSentinel
                onLoadMore={() => query.fetchNextPage()}
                disabled={!query.hasNextPage || query.isFetchingNextPage}
              />
              {query.isFetchingNextPage && (
                <p className="text-sm text-muted-foreground text-center py-2">Loading more…</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
