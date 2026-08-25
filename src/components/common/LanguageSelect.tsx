import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLanguages } from "@/lib/api/language";
import type { ContentLanguageLink } from "@/lib/api/content";
import { cn } from "@/lib/utils";

const LANGUAGES_KEY = ["languages", "all"] as const;

export function LanguageSelect({
  value,
  onChange,
}: {
  value: ContentLanguageLink[];
  onChange: (next: ContentLanguageLink[]) => void;
}) {
  const languagesQuery = useQuery({
    queryKey: LANGUAGES_KEY,
    queryFn: () => getLanguages({ limit: 100, status: "active" }),
  });
  const languages = languagesQuery.data?.languages ?? [];

  const toggle = (id: number) => {
    if (value.some((v) => v.languageId === id)) {
      onChange(value.filter((v) => v.languageId !== id));
    } else {
      onChange([...value, { languageId: id, isPrimary: value.length === 0 }]);
    }
  };

  const setPrimary = (id: number) => {
    onChange(value.map((v) => ({ ...v, isPrimary: v.languageId === id })));
  };

  if (languagesQuery.isLoading) {
    return <p className="text-xs text-muted-foreground">Loading languages…</p>;
  }
  if (languages.length === 0) {
    return <p className="text-xs text-muted-foreground">No languages yet — add some under Languages.</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-input rounded-md max-h-32 overflow-y-auto">
      {languages.map((l) => {
        const selected = value.find((v) => v.languageId === l.id);
        return (
          <span
            key={l.id}
            className={cn(
              "flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors",
              selected ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:bg-muted",
            )}
          >
            <button type="button" onClick={() => toggle(l.id)}>{l.name}</button>
            {selected && (
              <button type="button" onClick={() => setPrimary(l.id)} title="Mark as primary language">
                <Star className={cn("size-3", selected.isPrimary ? "fill-current" : "opacity-40")} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
