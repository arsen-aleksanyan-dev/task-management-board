import React, { useState, useCallback, useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { Column } from './Column';
import { FilterBar } from './FilterBar';
import { TaskFormModal } from './TaskFormModal';
import { ActivityFeed } from './ActivityFeed';
import { RealtimeUpdatesPanel } from './RealtimeUpdatesPanel';
import { TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'Todo' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'done', title: 'Done' },
];

export const Board: React.FC = () => {
  const { filteredTasks, moveTask } = useTaskContext();
  const [showModal, setShowModal] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Group filtered tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, typeof filteredTasks> = {
      'todo': [],
      'in-progress': [],
      'done': [],
    };

    filteredTasks.forEach(task => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTaskId) {
      moveTask(draggedTaskId, status);
      setDraggedTaskId(null);
    }
  }, [draggedTaskId, moveTask]);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Task Management Board</h1>
          <p className="text-gray-600">Organize and track your tasks with ease</p>
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

      {/* Task Form Modal */}
      {showModal && <TaskFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
};
