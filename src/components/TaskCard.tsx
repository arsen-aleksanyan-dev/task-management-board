import React, { memo } from 'react';
import { Calendar, Trash2, Loader2, Pencil } from 'lucide-react';
import { Task, TaskPriority } from '../types';
import { useTaskContext } from '../context/TaskContext';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEdit: (task: Task) => void;
}

const priorityConfig: Record<TaskPriority, { color: string; bgColor: string }> = {
  low: { color: 'text-green-700', bgColor: 'bg-green-100' },
  medium: { color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  high: { color: 'text-red-700', bgColor: 'bg-red-100' },
};

/**
 * Re-render optimizations:
 * - React.memo compares task (by reference) and onDragStart/onEdit (stable
 *   useCallback refs from Board). The card only re-renders when its own data
 *   changes or it transitions in/out of a pending state.
 * - isPending is read from context. Because pendingTasks is a Set that gets a
 *   new reference on every add/remove, all mounted TaskCards re-render when
 *   any task becomes pending. In practice, at most one or two tasks are pending
 *   simultaneously, so the visible diff is tiny. For the virtual-scroll path,
 *   off-screen cards are unmounted entirely, making this a non-issue at scale.
 */
export const TaskCard: React.FC<TaskCardProps> = memo(({ task, isDragging, onDragStart, onEdit }) => {
  const { deleteTask, pendingTasks } = useTaskContext();
  const isPending = pendingTasks.has(task.id);
  const { color, bgColor } = priorityConfig[task.priority];
  const formattedDate = new Date(task.createdDate).toLocaleDateString();

  return (
    <div
      role="listitem"
      aria-label={`${task.title}, ${task.priority} priority, assigned to ${task.assignee}${isPending ? ', saving' : ''}`}
      className={`relative bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 ${
        isDragging ? 'opacity-50' : ''
      } ${isPending ? 'opacity-60' : ''}`}
      draggable={!isPending}
      onDragStart={(e) => onDragStart(e, task.id)}
      tabIndex={0}
    >
      {/* Loading overlay shown while the API call is in-flight */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg z-10">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-100">
            <Loader2 size={14} className="animate-spin text-blue-500" />
            <span className="text-xs font-medium text-blue-600">Saving…</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="font-semibold text-gray-800 flex-1 line-clamp-2">{task.title}</h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            disabled={isPending}
            className="p-1 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-600 disabled:opacity-40"
            title="Edit task"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            disabled={isPending}
            className="p-1 hover:bg-red-100 rounded text-red-400 hover:text-red-600 disabled:opacity-40"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
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
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center text-xs text-gray-500 gap-1">
        <Calendar size={14} />
        {formattedDate}
        <span className="ml-auto text-gray-300">v{task.version}</span>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';
