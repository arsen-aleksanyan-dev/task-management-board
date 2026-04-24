import { useState, useCallback, useRef } from 'react';
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

export function useBoardDragDrop({ onMove }: UseBoardDragDropOptions): UseBoardDragDropResult {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  // Ref mirrors the state value so handleDrop can read it without being in deps.
  // Without this, updating draggedTaskId causes handleDrop to get a new reference,
  // which in turn causes Column (memo'd) to re-render mid-drag — producing the
  // "two cards" visual glitch.
  const draggedTaskIdRef = useRef<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    draggedTaskIdRef.current = taskId;
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);

    // Build a styled drag ghost from the card element itself.
    const card = (e.currentTarget as HTMLElement);
    const clone = card.cloneNode(true) as HTMLElement;
    clone.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${card.offsetWidth}px;
      pointer-events: none;
      opacity: 0.95;
      transform: rotate(2deg);
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    `;
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, card.offsetWidth / 2, 20);
    // Remove the clone after the browser has captured it for the drag image
    requestAnimationFrame(() => document.body.removeChild(clone));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    // Use the ref so this callback never needs draggedTaskId in its deps.
    const taskId = draggedTaskIdRef.current ?? e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMove(taskId, status);
      draggedTaskIdRef.current = null;
      setDraggedTaskId(null);
    }
  }, [onMove]);

  const handleDragEnd = useCallback(() => {
    draggedTaskIdRef.current = null;
    setDraggedTaskId(null);
  }, []);

  return { draggedTaskId, handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}
