import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ImagePreviewDialog({
  image,
  onClose,
}: {
  image: { path: string; url: string } | null;
  onClose: () => void;
}) {
  const name = image?.path.split("/").pop() ?? image?.path;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <DialogTitle className="truncate">{name}</DialogTitle>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => image && window.open(image.url, "_blank")}
            >
              <ExternalLink className="size-3.5 mr-1.5" />View full size
            </Button>
          </div>
        </DialogHeader>
        {image && (
          <img src={image.url} alt="" className="w-full max-h-[75vh] object-contain rounded-md bg-muted" />
        )}
      </DialogContent>
    </Dialog>
  );
}
