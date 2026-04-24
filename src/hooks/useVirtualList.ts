import { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualListOptions {
  itemCount: number;
  itemHeight: number;
  // Number of items to render beyond the visible area for smooth scrolling
  overscan?: number;
}

export interface VirtualItem {
  index: number;
  // Pixel offset from the top of the list
  start: number;
}

interface VirtualListResult {
  virtualItems: VirtualItem[];
  // Total scrollable height; set as height of the inner container
  totalHeight: number;
  // Attach to the scrollable container div
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Lightweight virtual list hook for rendering only visible items.
 *
 * Uses fixed item height for O(1) index calculation — no DOM measurement needed.
 * Overscan adds buffer items above/below viewport to prevent flicker during fast
 * scrolling. ResizeObserver keeps container height accurate on layout changes.
 *
 * Re-render optimization: only the slice of virtualItems changes on scroll,
 * so memoized item components outside the visible window are never re-rendered.
 */
export function useVirtualList({
  itemCount,
  itemHeight,
  overscan = 4,
}: VirtualListOptions): VirtualListResult {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(500);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    setContainerHeight(el.clientHeight);
    el.addEventListener('scroll', handleScroll, { passive: true });

    // Track container resize (e.g. window resize, sidebar collapse)
    const observer = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight);
    });
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [handleScroll]);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems: VirtualItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({ index: i, start: i * itemHeight });
  }

  return {
    virtualItems,
    totalHeight: itemCount * itemHeight,
    scrollContainerRef,
  };
}
