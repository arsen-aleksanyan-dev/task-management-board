import { Task } from './index';

export type HistoryEntryType = 'add' | 'delete' | 'move' | 'update';

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  /**
   * Human-readable description shown in the undo/redo toolbar.
   * Written in past tense from the perspective of the action that was performed:
   * "Moved 'Fix bug' → Done", "Deleted 'Old task'", etc.
   */
  description: string;
  type: HistoryEntryType;
  taskId: string;
  taskTitle: string;
  /**
   * Full task snapshot before the action. null when the task did not exist
   * before (i.e. the action was 'add').
   */
  before: Task | null;
  /**
   * Full task snapshot after the action. null when the task no longer exists
   * after (i.e. the action was 'delete').
   */
  after: Task | null;
}

export interface HistoryState {
  /**
   * Ordered list of committed history entries (oldest → newest).
   * Capped at MAX_HISTORY = 50 entries; excess entries are trimmed from the front.
   */
  stack: HistoryEntry[];
  /**
   * Index of the most-recently applied entry.
   * -1  → nothing has been applied yet (empty or fully undone)
   * ≥0  → stack[index] is the current "head"
   *
   * Undo moves index left (revert stack[index]).
   * Redo moves index right (re-apply stack[index+1]).
   * New actions truncate everything right of index, then push.
   */
  index: number;
}
