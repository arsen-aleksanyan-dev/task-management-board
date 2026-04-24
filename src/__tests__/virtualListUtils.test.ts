import { describe, it, expect } from 'vitest';
import { computeVirtualItems, computeTotalHeight } from '../utils/virtualListUtils';

describe('computeVirtualItems', () => {
  it('returns an empty array when itemCount is 0', () => {
    const items = computeVirtualItems({
      itemCount: 0,
      itemHeight: 50,
      scrollTop: 0,
      containerHeight: 400,
      overscan: 0,
    });
    expect(items).toHaveLength(0);
  });

  it('returns all items when the full list fits within the viewport', () => {
    const items = computeVirtualItems({
      itemCount: 4,
      itemHeight: 50,
      scrollTop: 0,
      containerHeight: 400,   // 400px > 4 × 50px
      overscan: 0,
    });
    expect(items).toHaveLength(4);
    expect(items[0]).toEqual({ index: 0, start: 0 });
    expect(items[3]).toEqual({ index: 3, start: 150 });
  });

  it('returns only the visible slice when the list is taller than the viewport', () => {
    // 10 items × 50px each. Viewport 0–200px.
    // Math.ceil(200/50) = 4 → endIndex = 4 (the item at px 200 is on the boundary,
    // so the algorithm includes it for glitch-free scrolling).
    const items = computeVirtualItems({
      itemCount: 10,
      itemHeight: 50,
      scrollTop: 0,
      containerHeight: 200,
      overscan: 0,
    });
    expect(items.map(i => i.index)).toEqual([0, 1, 2, 3, 4]);
  });

  it('adjusts the visible window correctly when scrolled down', () => {
    // scrollTop=250 → first visible item index = floor(250/50) = 5.
    // Viewport ends at 350 → Math.ceil(350/50) = 7 → endIndex = 7.
    const items = computeVirtualItems({
      itemCount: 20,
      itemHeight: 50,
      scrollTop: 250,
      containerHeight: 100,
      overscan: 0,
    });
    expect(items.map(i => i.index)).toEqual([5, 6, 7]);
  });

  it('includes extra overscan items above and below the visible range', () => {
    // scrollTop=500 → first visible = 10. Viewport ends at 600 → ceil(600/50)=12.
    // overscan=2 → startIndex = 8, endIndex = 14.
    const items = computeVirtualItems({
      itemCount: 50,
      itemHeight: 50,
      scrollTop: 500,
      containerHeight: 100,
      overscan: 2,
    });
    const indices = items.map(i => i.index);
    expect(indices[0]).toBe(8);
    expect(indices[indices.length - 1]).toBe(14);
  });

  it('clamps start index to 0 when overscan would go negative', () => {
    const items = computeVirtualItems({
      itemCount: 50,
      itemHeight: 50,
      scrollTop: 0,
      containerHeight: 100,
      overscan: 5,  // would extend to index -5, should clamp to 0
    });
    expect(items[0].index).toBe(0);
  });

  it('clamps end index to itemCount - 1 when overscan would exceed the list', () => {
    const items = computeVirtualItems({
      itemCount: 5,
      itemHeight: 50,
      scrollTop: 0,
      containerHeight: 600,  // taller than the list
      overscan: 10,
    });
    expect(items[items.length - 1].index).toBe(4);
  });

  it('computes correct pixel offsets (start = index × itemHeight)', () => {
    const items = computeVirtualItems({
      itemCount: 100,
      itemHeight: 80,
      scrollTop: 0,
      containerHeight: 240,
      overscan: 0,
    });
    items.forEach(item => {
      expect(item.start).toBe(item.index * 80);
    });
  });
});

describe('computeTotalHeight', () => {
  it('returns itemCount × itemHeight', () => {
    expect(computeTotalHeight(100, 50)).toBe(5000);
    expect(computeTotalHeight(0, 50)).toBe(0);
    expect(computeTotalHeight(1, 200)).toBe(200);
  });
});
