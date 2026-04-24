import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Task, TaskContextType, FilterOptions, TaskStatus, TaskPriority } from '../types';
import { useToastContext } from './ToastContext';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const TITLES = [
  'Fix authentication bug', 'Implement search feature', 'Refactor database layer',
  'Write unit tests', 'Deploy to staging', 'Optimize query performance',
  'Add error handling', 'Update API documentation', 'Review pull request',
  'Setup CI/CD pipeline', 'Implement caching layer', 'Fix memory leak',
  'Add pagination support', 'Migrate to TypeScript', 'Improve test coverage',
];
const MODULES = [
  'user service', 'payment gateway', 'notification system', 'auth module',
  'dashboard UI', 'data pipeline', 'reporting engine', 'file upload service',
];
const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];
const ASSIGNEES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Setup project structure',
    description: 'Initialize React project with TypeScript and Tailwind CSS',
    status: 'done',
    priority: 'high',
    assignee: 'Alice',
    tags: ['setup', 'infrastructure'],
    createdDate: new Date('2024-01-01'),
    updatedDate: new Date('2024-01-02'),
    version: 1,
  },
  {
    id: '2',
    title: 'Create task components',
    description: 'Build TaskCard, Column, and Board components',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Bob',
    tags: ['development', 'ui'],
    createdDate: new Date('2024-01-02'),
    updatedDate: new Date('2024-01-03'),
    version: 1,
  },
  {
    id: '3',
    title: 'Implement filtering',
    description: 'Add filter functionality for assignee, priority, and search',
    status: 'todo',
    priority: 'medium',
    assignee: 'Alice',
    tags: ['feature'],
    createdDate: new Date('2024-01-03'),
    updatedDate: new Date('2024-01-03'),
    version: 1,
  },
  {
    id: '4',
    title: 'Add drag and drop',
    description: 'Implement drag-and-drop between columns',
    status: 'todo',
    priority: 'high',
    assignee: 'Charlie',
    tags: ['feature', 'interaction'],
    createdDate: new Date('2024-01-03'),
    updatedDate: new Date('2024-01-03'),
    version: 1,
  },
];

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToastContext();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [pendingTasks, setPendingTasks] = useState<Set<string>>(new Set());

  // Ref tracks latest tasks for setTimeout callbacks without stale closure issues
  const tasksRef = useRef(tasks);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  const assignees = useMemo(
    () => Array.from(new Set(tasks.map(t => t.assignee))).sort(),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.assignee && task.assignee !== filters.assignee) return false;
      if (filters.priority?.length && !filters.priority.includes(task.priority)) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        if (
          !task.title.toLowerCase().includes(term) &&
          !task.description.toLowerCase().includes(term)
        ) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdDate' | 'updatedDate' | 'version'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdDate: new Date(),
      updatedDate: new Date(),
      version: 1,
    };
    setTasks(prev => [newTask, ...prev]);
  }, []);

  // updateTask is intentionally dependency-free: uses functional setState so
  // it never goes stale inside ActivityContext's setTimeout callbacks.
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, ...updates, updatedDate: updates.updatedDate ?? new Date() }
          : task
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  /**
   * Optimistic update strategy:
   * 1. Apply status change immediately to the UI.
   * 2. Simulate a 2-second API call with a 10% random failure rate.
   * 3. On failure: revert to the pre-move state and show an error toast.
   * 4. On success: remove from pendingTasks (no further action needed).
   *
   * The previous state is captured synchronously before the async delay,
   * so the rollback always restores the correct snapshot regardless of
   * concurrent updates.
   */
  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    const task = tasksRef.current.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const previousState = {
      status: task.status,
      version: task.version,
      updatedDate: task.updatedDate,
    };

    // Optimistic: show new status immediately
    setPendingTasks(prev => new Set([...prev, taskId]));
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, updatedDate: new Date(), version: t.version + 1 }
          : t
      )
    );

    // Simulate network round-trip
    setTimeout(() => {
      const failed = Math.random() < 0.1;

      if (failed) {
        setTasks(prev =>
          prev.map(t => (t.id === taskId ? { ...t, ...previousState } : t))
        );
        addToast(`Failed to move "${task.title}". Changes rolled back.`, 'error');
      }

      setPendingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 2000);
  }, [addToast]);

  /**
   * Bulk task generator for the performance/virtualization demo.
   * Creates `count` tasks spread across statuses, priorities, and assignees.
   */
  const generateTasks = useCallback((count: number) => {
    const now = Date.now();
    const newTasks: Task[] = Array.from({ length: count }, (_, i) => ({
      id: `gen-${now}-${i}`,
      title: `${TITLES[i % TITLES.length]} — ${MODULES[i % MODULES.length]} #${i + 1}`,
      description: `Auto-generated task #${i + 1} for virtualization performance demo`,
      status: STATUSES[i % STATUSES.length],
      priority: PRIORITIES[i % PRIORITIES.length],
      assignee: ASSIGNEES[i % ASSIGNEES.length],
      tags: ['generated', `batch-${Math.floor(i / 100)}`],
      createdDate: new Date(now - (count - i) * 60000),
      updatedDate: new Date(),
      version: 1,
    }));
    setTasks(prev => [...prev, ...newTasks]);
    addToast(`Generated ${count} tasks — virtual scroll now active`, 'info');
  }, [addToast]);

  const value: TaskContextType = {
    tasks,
    pendingTasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    filters,
    setFilters,
    filteredTasks,
    assignees,
    generateTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used within TaskProvider');
  return context;
};
