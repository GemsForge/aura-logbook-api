import { useCallback, useEffect, useRef, type TouchEvent } from "react";

/** Shares bounded arrow-key and horizontal-swipe navigation across expanded private-photo views. */
export function usePhotoViewerNavigation({ active, index, count, onNavigate }: {
  active: boolean;
  index: number;
  count: number;
  onNavigate: (nextIndex: number) => void;
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const previous = useCallback(() => { if (index > 0) onNavigate(index - 1); }, [index, onNavigate]);
  const next = useCallback(() => { if (index >= 0 && index < count - 1) onNavigate(index + 1); }, [count, index, onNavigate]);

  useEffect(() => {
    if (!active || count < 2 || index < 0) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        previous();
      } else if (event.key === "ArrowRight" && index < count - 1) {
        event.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, count, index, next, previous]);

  const onTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }, []);
  const onTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
    if (deltaX > 0) previous();
    else next();
  }, [next, previous]);

  return { previous, next, onTouchStart, onTouchEnd };
}
