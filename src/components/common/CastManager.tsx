import { useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getPersons } from "@/lib/api/person";
import { getRoles } from "@/lib/api/role";
import { cn } from "@/lib/utils";

// `key` is the real castId (as a string) for cast already saved on the
// content, or a "new-…" temp id for entries staged but not yet saved — the
// caller (the movie form) tells the two apart when committing on submit.
export type CastEntry = {
  key: string;
  personId: number;
  personName: string;
  roleId: number;
  roleName: string;
  characterName: string | null;
};

// Purely a display + staging component — it has no idea whether `onAdd`/
// `onRemove` hit the server immediately or just update local form state.
// This lets the same component work for a movie that doesn't exist yet
// (create) and one that already does (edit).
export function CastManager({
  cast,
  onAdd,
  onRemove,
}: {
  cast: CastEntry[];
  onAdd: (entry: Omit<CastEntry, "key">) => void;
  onRemove: (key: string) => void;
}) {
  const [personId, setPersonId] = useState("");
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [characterName, setCharacterName] = useState("");

  const personsQuery = useQuery({ queryKey: ["persons", "all"], queryFn: () => getPersons({ limit: 100 }) });
  const rolesQuery = useQuery({ queryKey: ["roles", "all"], queryFn: () => getRoles({ limit: 100, status: "active" }) });

  const selectedPerson = personsQuery.data?.persons.find((p) => p.id === Number(personId));
  const alreadyAddedRoleIds = cast.filter((c) => c.personId === Number(personId)).map((c) => c.roleId);
  // Only offer roles this person is actually tagged with on their profile,
  // minus ones already added for them on this movie.
  const availableRoles = (rolesQuery.data?.roles ?? []).filter(
    (r) => selectedPerson?.roleIds.includes(r.id) && !alreadyAddedRoleIds.includes(r.id),
  );

  const toggleRole = (id: number) => {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const handleAdd = () => {
    const person = selectedPerson;
    if (!person || roleIds.length === 0) {
      toast.error("Pick a person and at least one role.");
      return;
    }
    for (const roleId of roleIds) {
      const role = rolesQuery.data?.roles.find((r) => r.id === roleId);
      if (!role) continue;
      onAdd({
        personId: person.id,
        personName: person.name,
        roleId: role.id,
        roleName: role.name,
        characterName: characterName.trim() || null,
      });
    }
    setPersonId("");
    setRoleIds([]);
    setCharacterName("");
  };

  return (
    <div className="space-y-2">
      {cast.length > 0 && (
        <div className="space-y-1">
          {cast.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2 text-sm bg-muted/30 rounded-md px-2.5 py-1.5">
              <span className="truncate">
                {c.personName} <span className="text-muted-foreground">— {c.roleName}{c.characterName ? ` as ${c.characterName}` : ""}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(c.key)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-start">
        <Select
          value={personId}
          onValueChange={(v) => {
            setPersonId(v);
            setRoleIds([]);
          }}
        >
          <SelectTrigger className="flex-1 min-w-32"><SelectValue placeholder="Person" /></SelectTrigger>
          <SelectContent>
            {(personsQuery.data?.persons ?? []).map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Character (optional)"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          className="flex-1 min-w-32"
        />
        <Button type="button" size="sm" onClick={handleAdd}>Add</Button>
      </div>

      {personId && (
        <div className="flex flex-wrap gap-1.5">
          {!selectedPerson?.roleIds.length ? (
            <p className="text-xs text-muted-foreground">This person has no roles set on their profile yet.</p>
          ) : availableRoles.length === 0 ? (
            <p className="text-xs text-muted-foreground">All of this person's roles are already added.</p>
          ) : (
            availableRoles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.id)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-colors",
                  roleIds.includes(r.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input text-muted-foreground hover:bg-muted",
                )}
              >
                {r.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
