import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Column } from './Column';
import { FilterBar } from './FilterBar';
import { TaskFormModal } from './TaskFormModal';
import { ActivityFeed } from './ActivityFeed';
import { RealtimeUpdatesPanel } from './RealtimeUpdatesPanel';
import { ToastContainer } from './ToastContainer';
import { UndoRedoBar } from './UndoRedoBar';
import { Task, TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'Todo' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

export const Board: React.FC = () => {
  const { filteredTasks, moveTask, generateTasks, undo, redo } = useTaskContext();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Group filtered tasks by status — recomputed only when filteredTasks changes
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof filteredTasks> = {
      'todo': [],
      'in-progress': [],
      'done': [],
    };
    filteredTasks.forEach(task => grouped[task.status].push(task));
    return grouped;
  }, [filteredTasks]);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  /**
   * Global Ctrl/Cmd+Z → undo, Ctrl/Cmd+Shift+Z → redo.
   *
   * We use `document` rather than a focused element so shortcuts work
   * regardless of which element has focus, except when the user is typing in
   * an input/textarea (checked via event.target tag name).
   *
   * canUndo/canRedo are passed as deps so the handler always reflects the
   * current enabled state (avoids stale toast messages). undo/redo themselves
   * are stable useCallback refs.
   */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't intercept shortcuts while user is typing
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      if (!modifier) return;

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key === 'y' && !e.shiftKey) {
        // Windows convention: Ctrl+Y = redo
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // ── Drag and drop ──────────────────────────────────────────────────────────

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
      moveTask(taskId, status);
      setDraggedTaskId(null);
    }
  }, [draggedTaskId, moveTask]);

  const handleDragEnd = useCallback(() => setDraggedTaskId(null), []);

  const handleEdit = useCallback((task: Task) => setEditingTask(task), []);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
      onDragEnd={handleDragEnd}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1">Task Management Board</h1>
            <p className="text-gray-600">Organize and track your tasks with ease</p>
          </div>

          <button
            onClick={() => generateTasks(1000)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors border border-purple-200"
            title="Add 1000 tasks to demonstrate virtual scroll"
          >
            <Zap size={16} />
            Generate 1000 Tasks
          </button>
        </div>

        {/* Undo / Redo toolbar */}
        <div className="mb-4">
          <UndoRedoBar />
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar onCreateTask={() => setShowCreateModal(true)} />
        </div>

        {/* Main Layout: Board + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Board Columns */}
          <div className="lg:col-span-3 flex gap-6 h-[calc(100vh-390px)]">
            {COLUMNS.map(column => (
              <Column
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={tasksByStatus[column.status]}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
                onEdit={handleEdit}
              />
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 h-[calc(100vh-390px)] overflow-y-auto">
            <ActivityFeed />
            <RealtimeUpdatesPanel />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <TaskFormModal onClose={() => setShowCreateModal(false)} />
      )}
      {editingTask && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      <ToastContainer />
    </div>
  );
};
