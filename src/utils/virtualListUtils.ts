import { VirtualItem } from '../hooks/useVirtualList';

export interface ComputeVirtualItemsParams {
  itemCount: number;
  itemHeight: number;
  scrollTop: number;
  containerHeight: number;
  overscan: number;
}

/**
 * Pure function: given scroll state and item dimensions, returns the slice of
 * items that should currently be rendered.
 *
 * Isolated from React so it can be unit-tested without a DOM environment.
 * The hook (`useVirtualList`) calls this with live scroll/resize state.
 *
 * Algorithm: O(visible items) — we skip straight to the first visible index
 * via integer division rather than scanning the full list.
 */
export function computeVirtualItems({
  itemCount,
  itemHeight,
  scrollTop,
  containerHeight,
  overscan,
}: ComputeVirtualItemsParams): VirtualItem[] {
  if (itemCount === 0) return [];

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const items: VirtualItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    items.push({ index: i, start: i * itemHeight });
  }
  return items;
}

export function computeTotalHeight(itemCount: number, itemHeight: number): number {
  return itemCount * itemHeight;
}
