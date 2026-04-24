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
  addTask: (task: Omit<Task, 'id' | 'createdDate' | 'updatedDate' | 'version'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  filteredTasks: Task[];
  assignees: string[];
  generateTasks: (count: number) => void;
}
