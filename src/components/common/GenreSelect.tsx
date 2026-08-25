import { useQuery } from "@tanstack/react-query";
import { getGenres } from "@/lib/api/genre";
import { cn } from "@/lib/utils";

const GENRES_KEY = ["genres", "all"] as const;

export function GenreSelect({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const genresQuery = useQuery({
    queryKey: GENRES_KEY,
    queryFn: () => getGenres({ limit: 100, status: "active" }),
  });
  const genres = genresQuery.data?.genres ?? [];

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (genresQuery.isLoading) {
    return <p className="text-xs text-muted-foreground">Loading genres…</p>;
  }
  if (genres.length === 0) {
    return <p className="text-xs text-muted-foreground">No genres yet — add some under Categories.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-input rounded-md max-h-32 overflow-y-auto">
      {genres.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => toggle(g.id)}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border transition-colors",
            value.includes(g.id)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input text-muted-foreground hover:bg-muted",
          )}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
