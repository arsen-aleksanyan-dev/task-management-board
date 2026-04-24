import React, { memo } from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
}

const statusColors: Record<TaskStatus, string> = {
  'todo': 'bg-gray-50',
  'in-progress': 'bg-blue-50',
  'done': 'bg-green-50',
};

const statusBorderColors: Record<TaskStatus, string> = {
  'todo': 'border-gray-300',
  'in-progress': 'border-blue-300',
  'done': 'border-green-300',
};

export const Column: React.FC<ColumnProps> = memo(
  ({ status, title, tasks, onDragOver, onDrop }) => {
    return (
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
          {/* Header */}
          <div className={`p-4 border-b-2 ${statusBorderColors[status]} rounded-t-lg`}>
            <h2 className="font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{tasks.length} tasks</p>
          </div>

          {/* Drop Zone */}
          <div
            className={`flex-1 p-3 space-y-3 overflow-y-auto ${statusColors[status]} rounded-b-lg`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
            data-status={status}
          >
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <p className="text-sm">No tasks</p>
              </div>
            ) : (
              tasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);

Column.displayName = 'Column';
