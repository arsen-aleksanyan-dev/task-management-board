import { useState, useCallback } from 'react';
import { TaskStatus } from '../types';

interface UseBoardDragDropOptions {
  onMove: (taskId: string, newStatus: TaskStatus) => void;
}

interface UseBoardDragDropResult {
  draggedTaskId: string | null;
  handleDragStart: (e: React.DragEvent, taskId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, status: TaskStatus) => void;
  handleDragEnd: () => void;
}

/**
 * Custom hook that encapsulates all HTML5 drag-and-drop state for the Kanban
 * board. Extracted from Board so the component only manages layout concerns.
 *
 * Design notes:
 * - `draggedTaskId` is stored as state rather than a ref so that the dragging
 *   visual (opacity on the source card) re-renders correctly.
 * - The taskId is also written to `dataTransfer` as a fallback for drops that
 *   arrive from a different frame or after a fast pointer release before the
 *   React state settles.
 * - All callbacks are stable (useCallback) so Column and TaskCard memoization
 *   is not broken by Board re-renders.
 */
export function useBoardDragDrop({ onMove }: UseBoardDragDropOptions): UseBoardDragDropResult {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = draggedTaskId ?? e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMove(taskId, status);
      setDraggedTaskId(null);
    }
  }, [draggedTaskId, onMove]);

  const handleDragEnd = useCallback(() => setDraggedTaskId(null), []);

  return { draggedTaskId, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}
