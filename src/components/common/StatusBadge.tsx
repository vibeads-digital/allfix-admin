import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  Published: "bg-success/15 text-success border-success/20",
  Active: "bg-success/15 text-success border-success/20",
  Resolved: "bg-success/15 text-success border-success/20",
  done: "bg-success/15 text-success border-success/20",
  Draft: "bg-muted text-muted-foreground border-border",
  Pending: "bg-warning/15 text-warning border-warning/20",
  Scheduled: "bg-info/15 text-info border-info/20",
  running: "bg-info/15 text-info border-info/20",
  Open: "bg-info/15 text-info border-info/20",
  Paused: "bg-warning/15 text-warning border-warning/20",
  Archived: "bg-muted text-muted-foreground border-border",
  Suspended: "bg-warning/15 text-warning border-warning/20",
  Banned: "bg-destructive/15 text-destructive border-destructive/20",
  failed: "bg-destructive/15 text-destructive border-destructive/20",
  Completed: "bg-success/15 text-success border-success/20",
  Granted: "bg-info/15 text-info border-info/20",
  Refunded: "bg-muted text-muted-foreground border-border",
  "Partially Refunded": "bg-warning/15 text-warning border-warning/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", MAP[status] ?? "")}>
      {status}
    </Badge>
  );
}