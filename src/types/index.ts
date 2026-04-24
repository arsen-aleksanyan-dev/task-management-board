import { HistoryEntry } from './history';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  tags?: string[];
  createdDate: Date;
  updatedDate: Date;
  // Monotonically increasing counter used for conflict detection
  version: number;
}

export interface FilterOptions {
  assignee?: string;
  priority?: TaskPriority[];
  searchTerm?: string;
}

export interface TaskContextType {
  tasks: Task[];
  // Set of task IDs whose API call is in-flight (optimistic update pending)
  pendingTasks: Set<string>;

  // ── Mutations (all user-initiated; they record history entries) ──────────
  addTask: (task: Omit<Task, 'id' | 'createdDate' | 'updatedDate' | 'version'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;

  // ── External / simulated update — does NOT record a history entry ────────
  applyExternalUpdate: (id: string, updates: Partial<Task>) => void;

  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  filteredTasks: Task[];
  assignees: string[];
  generateTasks: (count: number) => void;

  // ── Undo / Redo ──────────────────────────────────────────────────────────
  history: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  /** Description of the action that will be reverted on the next undo call. */
  undoDescription: string | null;
  /** Description of the action that will be replayed on the next redo call. */
  redoDescription: string | null;
  undo: () => void;
  redo: () => void;
}
