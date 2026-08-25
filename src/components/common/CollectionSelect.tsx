import { useQuery } from "@tanstack/react-query";
import { getCollections } from "@/lib/api/collections";
import { cn } from "@/lib/utils";

const COLLECTIONS_KEY = ["collections", "active"] as const;

export function CollectionSelect({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const collectionsQuery = useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: () => getCollections({ limit: 100, status: "active" }),
  });
  const collections = collectionsQuery.data?.collections ?? [];

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  if (collectionsQuery.isLoading) {
    return <p className="text-xs text-muted-foreground">Loading collections…</p>;
  }
  if (collections.length === 0) {
    return <p className="text-xs text-muted-foreground">No collections yet — add some under Collections.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-input rounded-md max-h-32 overflow-y-auto">
      {collections.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => toggle(c.id)}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border transition-colors",
            value.includes(c.id)
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input text-muted-foreground hover:bg-muted",
          )}
        >
          {c.title}
        </button>
      ))}
    </div>
  );
}
