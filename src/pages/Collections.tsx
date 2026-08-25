import { useState } from "react";
import { ChevronDown, ChevronUp, Film, FolderHeart, Pencil, Plus, Settings2, Trash2, Tv } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContentPicker } from "@/components/common/ContentPicker";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  addCollectionItem,
  createCollection,
  deleteCollection,
  getCollectionItems,
  getCollections,
  removeCollectionItem,
  reorderCollectionItem,
  setCollectionStatus,
  updateCollection,
  type Collection,
} from "@/lib/api/collections";
import type { ContentListItem } from "@/lib/api/content";
import { usePageSearch } from "@/store/topbar-search";

const COLLECTIONS_KEY = ["collections"] as const;
const emptyForm = { title: "", description: "" };

export function CollectionsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [itemsCollectionId, setItemsCollectionId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  usePageSearch("Search collections…", searchQuery, setSearchQuery);

  const { data, isLoading } = useQuery({ queryKey: COLLECTIONS_KEY, queryFn: () => getCollections({ status: "all", limit: 100 }) });
  const allCollections = data?.collections ?? [];
  const collections = searchQuery
    ? allCollections.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : allCollections;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEY });

  const closeFormDialog = () => {
    setCreateOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (c: Collection) => {
    setEditing(c);
    setForm({ title: c.title, description: c.description ?? "" });
  };

  const createMutation = useMutation({
    mutationFn: () =>
      createCollection({
        title: form.title,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      toast.success("Collection created");
      invalidate();
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateCollection(editing!.id, {
        title: form.title,
        description: form.description || null,
      }),
    onSuccess: () => {
      toast.success("Collection updated");
      invalidate();
      closeFormDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setCollectionStatus(id, isActive),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCollection(id),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const allSelected = collections.length > 0 && collections.every((c) => selected.has(c.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) collections.forEach((c) => next.delete(c.id));
    else collections.forEach((c) => next.add(c.id));
    setSelected(next);
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const bulkDelete = async () => {
    await Promise.all(Array.from(selected).map((id) => deleteCollection(id)));
    toast.success(`Deleted ${selected.size} collection${selected.size > 1 ? "s" : ""}`);
    setSelected(new Set());
    invalidate();
  };

  const itemsCollection = allCollections.find((c) => c.id === itemsCollectionId) ?? null;

  return (
    <>
      <PageHeader
        title="Curated Collections"
        description="Manually chosen rows of titles — independent of trending/recommendations"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4 mr-2" />New collection
          </Button>
        }
      />
      <SectionCard title="All collections" description="Named, ordered groups of movies and series">
        {selected.size > 0 && (
          <div className="flex items-center gap-2 p-2 mb-3 rounded-md bg-primary/10 border border-primary/20 text-sm">
            <span className="font-medium">{selected.size} selected</span>
            <Button variant="destructive" size="sm" className="ml-auto" onClick={bulkDelete}>
              <Trash2 className="size-3.5 mr-1" />
              Delete
            </Button>
          </div>
        )}
        {isLoading ? (
          <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
        ) : collections.length === 0 ? (
          <EmptyState icon={FolderHeart} title="No collections yet" description="Create one to get started." />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-5 py-2 w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  </th>
                  <th className="py-2 font-medium">Title</th>
                  <th className="py-2 font-medium">Items</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {collections.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleOne(c.id)} />
                    </td>
                    <td className="py-3">
                      <div className="font-medium">{c.title}</div>
                      {c.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{c.description}</div>}
                    </td>
                    <td className="py-3 text-muted-foreground tabular-nums">{c.itemCount}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.isActive ? "Active" : "Paused"} />
                        <Switch checked={c.isActive} onCheckedChange={(checked) => statusMutation.mutate({ id: c.id, isActive: checked })} />
                      </div>
                    </td>
                    <td className="py-3 pr-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => setItemsCollectionId(c.id)}>
                          <Settings2 className="size-3.5 mr-1" />Titles
                        </Button>
                        <Button variant="outline" size="icon" className="size-7" aria-label="Edit" onClick={() => openEdit(c)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7 text-destructive hover:text-destructive"
                          aria-label="Delete"
                          onClick={() => deleteMutation.mutate(c.id)}
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
        )}
      </SectionCard>

      <Dialog open={createOpen || !!editing} onOpenChange={(open) => !open && closeFormDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? `Edit "${editing.title}"` : "New collection"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this collection's details." : "Create a named, manually-curated row of titles."}
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
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Diwali Special"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What's this collection about?"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeFormDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || editMutation.isPending}>
                {editing
                  ? editMutation.isPending ? "Saving…" : "Save changes"
                  : createMutation.isPending ? "Creating…" : "Create collection"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemsCollectionId} onOpenChange={(open) => !open && setItemsCollectionId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Titles — {itemsCollection?.title}</DialogTitle>
            <DialogDescription>The movies and series shown in this collection, in order.</DialogDescription>
          </DialogHeader>
          {itemsCollectionId && <CollectionItemsManager collectionId={itemsCollectionId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CollectionItemsManager({ collectionId }: { collectionId: number }) {
  const queryClient = useQueryClient();
  const [selectedContent, setSelectedContent] = useState<ContentListItem | null>(null);

  const key = ["collection-items", collectionId] as const;
  const { data: items = [], isLoading } = useQuery({ queryKey: key, queryFn: () => getCollectionItems(collectionId) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const addMutation = useMutation({
    mutationFn: () => addCollectionItem(collectionId, selectedContent!.id),
    onSuccess: () => {
      toast.success("Title added");
      setSelectedContent(null);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => removeCollectionItem(itemId),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ itemId, displayOrder }: { itemId: number; displayOrder: number }) => reorderCollectionItem(itemId, displayOrder),
    onSuccess: invalidate,
    onError: (err: Error) => toast.error(err.message),
  });

  const moveItem = (index: number, direction: -1 | 1) => {
    const current = items[index];
    const other = items[index + direction];
    if (!other) return;
    reorderMutation.mutate({ itemId: current.itemId, displayOrder: other.displayOrder });
    reorderMutation.mutate({ itemId: other.itemId, displayOrder: current.displayOrder });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-sm text-muted-foreground py-4 text-center">Loading…</div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No titles yet.</p>
      ) : (
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {items.map((item, index) => (
            <li key={item.itemId} className="flex items-center gap-2 p-2 rounded-md border border-border text-sm">
              <div className="size-9 rounded overflow-hidden bg-muted shrink-0 grid place-items-center">
                {item.posterUrl || item.thumbnailUrl ? (
                  <img src={item.posterUrl ?? item.thumbnailUrl ?? undefined} alt="" className="size-full object-cover" />
                ) : item.type === "movie" ? (
                  <Film className="size-3.5 text-muted-foreground" />
                ) : (
                  <Tv className="size-3.5 text-muted-foreground" />
                )}
              </div>
              <span className="flex-1 truncate">{item.title}</span>
              <Badge variant="outline" className="text-[10px]">{item.type === "movie" ? "Movie" : "Series"}</Badge>
              <Button variant="ghost" size="icon" className="size-6" disabled={index === 0} onClick={() => moveItem(index, -1)}>
                <ChevronUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)}>
                <ChevronDown className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6" onClick={() => removeMutation.mutate(item.itemId)}>
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 pt-3 border-t border-border">
        <Label className="mb-1.5 block">Add a title</Label>
        <ContentPicker value={selectedContent} onChange={setSelectedContent} typeFilter="all" placeholder="Search movie or series…" />
        <Button type="button" className="w-full" disabled={!selectedContent || addMutation.isPending} onClick={() => addMutation.mutate()}>
          {addMutation.isPending ? "Adding…" : "Add to collection"}
        </Button>
      </div>
    </div>
  );
}
