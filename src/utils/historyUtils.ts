import { Task } from '../types';
import { HistoryEntry, HistoryState } from '../types/history';

export const MAX_HISTORY = 50;

/**
 * Pure reducer: push a new committed entry onto the history stack.
 *
 * Semantics:
 * - Entries to the right of `index` (the "redo branch") are discarded. This
 *   matches the standard linear undo model: branching after undo replaces the
 *   future rather than forking it.
 * - Once the stack reaches MAX_HISTORY entries the oldest entry is trimmed so
 *   the stack never grows unbounded.
 */
export function pushToHistory(state: HistoryState, entry: HistoryEntry): HistoryState {
  const base = state.stack.slice(0, state.index + 1);
  const updated = [...base, entry];
  const trimmed =
    updated.length > MAX_HISTORY ? updated.slice(updated.length - MAX_HISTORY) : updated;
  return { stack: trimmed, index: trimmed.length - 1 };
}

/**
 * Pure reducer: move the history pointer one step back (undo).
 * Does NOT mutate task state — callers do that separately via applyUndo.
 */
export function stepBackHistory(state: HistoryState): HistoryState {
  if (state.index < 0) return state;
  return { ...state, index: state.index - 1 };
}

/**
 * Pure reducer: move the history pointer one step forward (redo).
 * Does NOT mutate task state — callers do that separately via applyRedo.
 */
export function stepForwardHistory(state: HistoryState): HistoryState {
  if (state.index >= state.stack.length - 1) return state;
  return { ...state, index: state.index + 1 };
}

/**
 * Pure function: compute the new task list after undoing `entry`.
 * Returns `null` if the entry cannot be applied (e.g. task missing for move).
 */
export function applyUndo(tasks: Task[], entry: HistoryEntry): Task[] | null {
  switch (entry.type) {
    case 'add':
      return tasks.filter(t => t.id !== entry.taskId);

    case 'delete':
      if (!entry.before) return null;
      return [entry.before, ...tasks.filter(t => t.id !== entry.taskId)];

    case 'move':
    case 'update': {
      if (!entry.before) return null;
      const exists = tasks.some(t => t.id === entry.taskId);
      if (!exists) return null;
      return tasks.map(t => (t.id === entry.taskId ? entry.before! : t));
    }

    default:
      return tasks;
  }
}

/**
 * Pure function: compute the new task list after redoing `entry`.
 * Returns `null` if the entry cannot be applied (e.g. task missing for move).
 */
export function applyRedo(tasks: Task[], entry: HistoryEntry): Task[] | null {
  switch (entry.type) {
    case 'delete':
      return tasks.filter(t => t.id !== entry.taskId);

    case 'add':
      if (!entry.after) return null;
      return [entry.after, ...tasks.filter(t => t.id !== entry.taskId)];

    case 'move':
    case 'update': {
      if (!entry.after) return null;
      const exists = tasks.some(t => t.id === entry.taskId);
      if (!exists) return null;
      return tasks.map(t => (t.id === entry.taskId ? entry.after! : t));
    }

    default:
      return tasks;
  }
}
