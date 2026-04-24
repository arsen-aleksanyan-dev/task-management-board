import React, { memo } from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { Task, TaskPriority } from '../types';
import { useTaskContext } from '../context/TaskContext';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityConfig: Record<TaskPriority, { color: string; bgColor: string }> = {
  low: { color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  high: { color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const TaskCard: React.FC<TaskCardProps> = memo(({ task, isDragging }) => {
  const { deleteTask } = useTaskContext();
  const { color, bgColor } = priorityConfig[task.priority];

  const formattedDate = new Date(task.createdDate).toLocaleDateString();

  return (
    <div
      className={`bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
      draggable
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="font-semibold text-gray-800 flex-1 line-clamp-2">{task.title}</h3>
        <button
          onClick={() => deleteTask(task.id)}
          className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-700 flex-shrink-0"
          title="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

      <div className="flex gap-2 mb-3">
        <span className={`px-2 py-1 rounded text-xs font-medium ${bgColor} ${color}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          {task.assignee}
        </span>
      </div>

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Calendar size={14} />
        {formattedDate}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
