import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Task, TaskContextType, FilterOptions, TaskStatus, TaskPriority } from '../types';
import { HistoryEntry, HistoryState } from '../types/history';
import { useToastContext } from './ToastContext';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const MAX_HISTORY = 50;

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

  /**
   * Undo/redo history stored as a single atomic state object so that stack and
   * index are always updated together and React never sees an inconsistent pair.
   */
  const [historyState, setHistoryState] = useState<HistoryState>({ stack: [], index: -1 });

  // Refs for stable access inside async callbacks (setTimeout closures)
  const tasksRef = useRef(tasks);
  const pendingTasksRef = useRef(pendingTasks);
  const historyStateRef = useRef(historyState);

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { pendingTasksRef.current = pendingTasks; }, [pendingTasks]);
  useEffect(() => { historyStateRef.current = historyState; }, [historyState]);

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

  // ── History helpers ────────────────────────────────────────────────────────

  /**
   * Pushes a committed entry onto the history stack.
   *
   * On push:
   * - All entries to the right of the current index (the "redo stack") are
   *   discarded — this matches the standard linear undo model used by most
   *   editors.
   * - If the stack would exceed MAX_HISTORY, the oldest entry is trimmed.
   *
   * Stable ([] deps) because it only uses setHistoryState whose identity is
   * guaranteed stable by React.
   */
  const pushHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };

    setHistoryState(prev => {
      const base = prev.stack.slice(0, prev.index + 1); // drop redo branch
      const updated = [...base, newEntry];
      const trimmed = updated.length > MAX_HISTORY
        ? updated.slice(updated.length - MAX_HISTORY)
        : updated;
      return { stack: trimmed, index: trimmed.length - 1 };
    });
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdDate' | 'updatedDate' | 'version'>) => {
    const newTask: Task = {
      ...taskData,
      id: Math.random().toString(36).substr(2, 9),
      createdDate: new Date(),
      updatedDate: new Date(),
      version: 1,
    };
    setTasks(prev => [newTask, ...prev]);
    pushHistory({
      type: 'add',
      taskId: newTask.id,
      taskTitle: newTask.title,
      description: `Created "${newTask.title}"`,
      before: null,
      after: newTask,
    });
  }, [pushHistory]);

  /**
   * User-initiated update. Records a history entry with a diff-based
   * description so the user can see exactly what changed.
   */
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const taskBefore = tasksRef.current.find(t => t.id === id);
    if (!taskBefore) return;

    const taskAfter: Task = {
      ...taskBefore,
      ...updates,
      updatedDate: updates.updatedDate ?? new Date(),
    };
    setTasks(prev => prev.map(t => (t.id === id ? taskAfter : t)));

    const changes: string[] = [];
    if (updates.title && updates.title !== taskBefore.title) changes.push('title');
    if (updates.priority && updates.priority !== taskBefore.priority) {
      changes.push(`priority: ${taskBefore.priority} → ${updates.priority}`);
    }
    if (updates.assignee && updates.assignee !== taskBefore.assignee) {
      changes.push(`assignee: ${taskBefore.assignee} → ${updates.assignee}`);
    }
    if (updates.status && updates.status !== taskBefore.status) {
      changes.push(`status → ${updates.status}`);
    }
    const description = changes.length
      ? `Updated "${taskBefore.title}" (${changes.join(', ')})`
      : `Updated "${taskBefore.title}"`;

    pushHistory({
      type: 'update',
      taskId: id,
      taskTitle: taskBefore.title,
      description,
      before: taskBefore,
      after: taskAfter,
    });
  }, [pushHistory]);

  /**
   * Applied by ActivityContext for simulated remote changes and conflict
   * resolution that the user didn't initiate. Bypasses the history stack so
   * remote edits do not pollute the local undo history.
   */
  const applyExternalUpdate = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, ...updates, updatedDate: updates.updatedDate ?? new Date() }
          : t
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    const task = tasksRef.current.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    pushHistory({
      type: 'delete',
      taskId: id,
      taskTitle: task.title,
      description: `Deleted "${task.title}"`,
      before: task,
      after: null,
    });
  }, [pushHistory]);

  /**
   * Optimistic move with a 2-second simulated API call.
   *
   * History strategy: only push to history on *success*. If the API call
   * fails, the state is rolled back and no history entry is written — there
   * is nothing to undo.
   *
   * Race condition / undo interaction: undo and redo are disabled while any
   * tasks are in pendingTasks (checked in canUndo/canRedo). This prevents
   * the user from undoing an action that is still resolving, which would
   * require complex two-phase history management.
   */
  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    const task = tasksRef.current.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Snapshot before the optimistic update (used for both rollback and history)
    const taskBefore = { ...task };

    setPendingTasks(prev => new Set([...prev, taskId]));
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, status: newStatus, updatedDate: new Date(), version: t.version + 1 }
          : t
      )
    );

    setTimeout(() => {
      const failed = Math.random() < 0.1;

      if (failed) {
        // Rollback — restore exact pre-move snapshot
        setTasks(prev => prev.map(t => (t.id === taskId ? taskBefore : t)));
        addToast(`Failed to move "${task.title}". Changes rolled back.`, 'error');
        // No history entry: the move never committed.
      } else {
        // Committed — record to history using current task state as `after`
        const taskAfter = tasksRef.current.find(t => t.id === taskId) ?? {
          ...taskBefore,
          status: newStatus,
          version: taskBefore.version + 1,
        };
        pushHistory({
          type: 'move',
          taskId,
          taskTitle: task.title,
          description: `Moved "${task.title}" → ${newStatus}`,
          before: taskBefore,
          after: taskAfter,
        });
      }

      setPendingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 2000);
  }, [addToast, pushHistory]);

  // ── Undo / Redo ────────────────────────────────────────────────────────────

  /**
   * Reverts the action at historyState.index.
   *
   * Uses refs for pendingTasks and historyState so the callback stays stable
   * and doesn't need to be recreated on each render. This is important because
   * the keyboard handler in Board.tsx captures `undo` by reference.
   *
   * Edge cases handled:
   * - Blocked while any optimistic update is in-flight (pendingTasks is non-empty)
   * - If the target task no longer exists (deleted after move), shows an error
   */
  const undo = useCallback(() => {
    if (pendingTasksRef.current.size > 0) {
      addToast('Cannot undo while a save is in progress', 'warning');
      return;
    }

    const { stack, index } = historyStateRef.current;
    if (index < 0) return;

    const entry = stack[index];

    switch (entry.type) {
      case 'add':
        // Undo create → delete the task
        setTasks(prev => prev.filter(t => t.id !== entry.taskId));
        break;

      case 'delete':
        // Undo delete → restore the task (prepend so it's visible immediately)
        if (entry.before) {
          setTasks(prev => [entry.before!, ...prev.filter(t => t.id !== entry.taskId)]);
        }
        break;

      case 'move':
      case 'update':
        // Undo move/update → revert to before-snapshot
        if (entry.before) {
          const exists = tasksRef.current.some(t => t.id === entry.taskId);
          if (!exists) {
            addToast(`Cannot undo: "${entry.taskTitle}" no longer exists`, 'error');
            return;
          }
          setTasks(prev => prev.map(t => (t.id === entry.taskId ? entry.before! : t)));
        }
        break;
    }

    setHistoryState(prev => ({ ...prev, index: prev.index - 1 }));
    addToast(`Undid: ${entry.description}`, 'info');
  }, [addToast]);

  /**
   * Re-applies the action at historyState.index + 1.
   */
  const redo = useCallback(() => {
    if (pendingTasksRef.current.size > 0) {
      addToast('Cannot redo while a save is in progress', 'warning');
      return;
    }

    const { stack, index } = historyStateRef.current;
    if (index >= stack.length - 1) return;

    const entry = stack[index + 1];

    switch (entry.type) {
      case 'add':
        // Redo create → re-insert the task
        if (entry.after) {
          setTasks(prev => [entry.after!, ...prev.filter(t => t.id !== entry.taskId)]);
        }
        break;

      case 'delete':
        // Redo delete → remove again
        setTasks(prev => prev.filter(t => t.id !== entry.taskId));
        break;

      case 'move':
      case 'update':
        // Redo move/update → apply after-snapshot
        if (entry.after) {
          const exists = tasksRef.current.some(t => t.id === entry.taskId);
          if (!exists) {
            addToast(`Cannot redo: "${entry.taskTitle}" no longer exists`, 'error');
            return;
          }
          setTasks(prev => prev.map(t => (t.id === entry.taskId ? entry.after! : t)));
        }
        break;
    }

    setHistoryState(prev => ({ ...prev, index: prev.index + 1 }));
    addToast(`Redid: ${entry.description}`, 'info');
  }, [addToast]);

  // ── Derived undo/redo state ────────────────────────────────────────────────

  /**
   * Undo and redo are blocked while optimistic updates are in-flight.
   * Allowing undo during a pending move would require two-phase rollback logic
   * (cancel the pending API call AND revert the state), which is out of scope.
   */
  const hasPending = pendingTasks.size > 0;
  const canUndo = historyState.index >= 0 && !hasPending;
  const canRedo = historyState.index < historyState.stack.length - 1 && !hasPending;
  const undoDescription = historyState.index >= 0
    ? historyState.stack[historyState.index].description
    : null;
  const redoDescription = historyState.index < historyState.stack.length - 1
    ? historyState.stack[historyState.index + 1].description
    : null;

  // ── Performance demo ───────────────────────────────────────────────────────

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
    // generateTasks is intentionally excluded from history: 1000 individual
    // 'add' entries would flood the stack and confuse the undo story.
  }, [addToast]);

  const value: TaskContextType = {
    tasks,
    pendingTasks,
    addTask,
    updateTask,
    applyExternalUpdate,
    deleteTask,
    moveTask,
    filters,
    setFilters,
    filteredTasks,
    assignees,
    generateTasks,
    history: historyState.stack,
    historyIndex: historyState.index,
    canUndo,
    canRedo,
    undoDescription,
    redoDescription,
    undo,
    redo,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTaskContext must be used within TaskProvider');
  return context;
};
