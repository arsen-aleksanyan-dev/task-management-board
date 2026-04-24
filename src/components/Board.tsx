import React, { useState, useCallback, useMemo } from 'react';
import { Zap } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { Column } from './Column';
import { FilterBar } from './FilterBar';
import { TaskFormModal } from './TaskFormModal';
import { ActivityFeed } from './ActivityFeed';
import { RealtimeUpdatesPanel } from './RealtimeUpdatesPanel';
import { ToastContainer } from './ToastContainer';
import { TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'Todo' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

export const Board: React.FC = () => {
  const { filteredTasks, moveTask, generateTasks } = useTaskContext();
  const [showModal, setShowModal] = useState(false);
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

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    // Store taskId in dataTransfer for cross-window safety (good practice)
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

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Task Management Board</h1>
            <p className="text-gray-600">Organize and track your tasks with ease</p>
          </div>

          {/* Performance demo button */}
          <button
            onClick={() => generateTasks(1000)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors border border-purple-200"
            title="Add 1000 tasks to demonstrate virtual scroll"
          >
            <Zap size={16} />
            Generate 1000 Tasks
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mb-6">
          <FilterBar onCreateTask={() => setShowModal(true)} />
        </div>

        {/* Main Layout: Board + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Board Columns */}
          <div className="lg:col-span-3 flex gap-6 h-[calc(100vh-350px)]">
            {COLUMNS.map(column => (
              <Column
                key={column.status}
                status={column.status}
                title={column.title}
                tasks={tasksByStatus[column.status]}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragStart={handleDragStart}
              />
            ))}
          </div>

          {/* Sidebar: Activity & Realtime Updates */}
          <div className="lg:col-span-1 space-y-4 h-[calc(100vh-350px)] overflow-y-auto">
            <ActivityFeed />
            <RealtimeUpdatesPanel />
          </div>
        </div>
      </div>

      {showModal && <TaskFormModal onClose={() => setShowModal(false)} />}

      {/* Toast notifications — rendered above everything else */}
      <ToastContainer />
    </div>
  );
};
