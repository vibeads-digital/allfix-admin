import { useEffect, useRef } from "react";

// Fires onLoadMore once when scrolled into view — used to drive infinite
// scroll instead of numbered pages.
export function LoadMoreSentinel({ onLoadMore, disabled }: { onLoadMore: () => void; disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, disabled]);

  return <div ref={ref} className="h-1" />;
}
