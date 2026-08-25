import { useCallback, useEffect, useRef, useState } from "react";
import Hls, { type Level } from "hls.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function attachNativeSource(el: HTMLVideoElement, url: string) {
  el.src = url;
}

export function VideoPlayerDialog({
  video,
  onClose,
}: {
  video: { title: string; hlsUrl: string } | null;
  onClose: () => void;
}) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const hlsRef = useRef<Hls | null>(null);

  // Callback ref instead of useRef — Radix mounts DialogContent into a portal
  // on open, so the element may not exist yet on the same effect run as `video`.
  const setRef = useCallback((el: HTMLVideoElement | null) => setVideoEl(el), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset transient state for the new video
    setError(null); setLevels([]); setCurrentLevel(-1);
    if (!video || !videoEl) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.on(Hls.Events.MANIFEST_PARSED, () => setLevels(hls.levels));
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError(`Playback error: ${data.details}`);
      });
      hls.loadSource(video.hlsUrl);
      hls.attachMedia(videoEl);
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      attachNativeSource(videoEl, video.hlsUrl);
    } else {
      setError("HLS playback isn't supported in this browser.");
    }
  }, [video, videoEl]);

  const changeQuality = (value: string) => {
    const index = Number(value);
    setCurrentLevel(index);
    if (hlsRef.current) hlsRef.current.currentLevel = index;
  };

  const sortedLevels = levels
    .map((level, index) => ({ index, height: level.height }))
    .sort((a, b) => b.height - a.height);

  return (
    <Dialog open={!!video} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{video?.title}</DialogTitle>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {sortedLevels.length > 0 && (
          <div className="flex items-center gap-2 -mt-1">
            <span className="text-xs text-muted-foreground">Quality</span>
            <Select value={String(currentLevel)} onValueChange={changeQuality}>
              <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Auto</SelectItem>
                {sortedLevels.map((l) => (
                  <SelectItem key={l.index} value={String(l.index)}>{l.height}p</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <video ref={setRef} controls autoPlay className="w-full aspect-video rounded-md bg-black" />
      </DialogContent>
    </Dialog>
  );
}
