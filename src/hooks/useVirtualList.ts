import { useRef, useState, useCallback, useEffect } from 'react';
import { computeVirtualItems, computeTotalHeight } from '../utils/virtualListUtils';

interface VirtualListOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

export interface VirtualItem {
  index: number;
  start: number;
}

interface VirtualListResult {
  virtualItems: VirtualItem[];
  totalHeight: number;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Lightweight virtual list hook.
 *
 * Delegates the visible-window calculation to the pure `computeVirtualItems`
 * utility (testable without a DOM) and only handles the React-specific
 * concerns here: scroll events, container sizing via ResizeObserver.
 *
 * Re-render behavior: `virtualItems` changes on every scroll tick, but each
 * array typically contains only ~10 items regardless of total itemCount, so
 * diffing is O(visible items), not O(total items).
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

    const observer = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight);
    });
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [handleScroll]);

  const virtualItems = computeVirtualItems({
    itemCount,
    itemHeight,
    scrollTop,
    containerHeight,
    overscan,
  });

  return {
    virtualItems,
    totalHeight: computeTotalHeight(itemCount, itemHeight),
    scrollContainerRef,
  };
}
