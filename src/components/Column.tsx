import React, { memo } from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { useVirtualList } from '../hooks/useVirtualList';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
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

/**
 * Virtualization threshold: activate the virtual list once there are enough
 * tasks that the fixed-height estimate is worth the complexity trade-off.
 * Below this limit we use the normal flow layout (accurate heights, simpler).
 */
const VIRTUALIZE_AT = 30;

/**
 * Estimated height of one TaskCard in pixels (padding + title + description +
 * badges + tags + date row + gap). Cards without tags are shorter, but a
 * slight over-estimate is fine — it just adds a small invisible scroll buffer.
 */
const CARD_HEIGHT = 176;

/**
 * Re-render optimization:
 * Column is wrapped in React.memo. Its props are:
 *   - tasks[]   — new array reference on every filteredTasks change
 *   - callbacks — stable (useCallback in Board)
 *
 * When the board has 1000+ tasks, tasksByStatus is recomputed by useMemo in
 * Board only when filteredTasks changes, so each Column receives a stable
 * reference until a relevant task moves.
 *
 * Inside the virtual list, only the ~5–10 visible TaskCards are mounted at a
 * time. Scrolling replaces a small subset of rendered cards rather than
 * re-rendering all 1000+.
 */
export const Column: React.FC<ColumnProps> = memo(
  ({ status, title, tasks, onDragOver, onDrop, onDragStart }) => {
    const shouldVirtualize = tasks.length >= VIRTUALIZE_AT;

    const { virtualItems, totalHeight, scrollContainerRef } = useVirtualList({
      itemCount: tasks.length,
      itemHeight: CARD_HEIGHT,
      overscan: 4,
    });

    return (
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm h-full flex flex-col">
          {/* Header */}
          <div className={`p-4 border-b-2 ${statusBorderColors[status]} rounded-t-lg`}>
            <h2 className="font-bold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {tasks.length} tasks
              {shouldVirtualize && (
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                  virtual
                </span>
              )}
            </p>
          </div>

          {/* Drop Zone */}
          <div
            ref={scrollContainerRef}
            className={`flex-1 p-3 overflow-y-auto ${statusColors[status]} rounded-b-lg`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
            data-status={status}
          >
            {tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <p className="text-sm">No tasks</p>
              </div>
            ) : shouldVirtualize ? (
              /*
               * Virtual list: a single tall container whose height equals
               * itemCount × itemHeight. Only the visible slice is rendered.
               * Each item is absolutely positioned via translateY so the
               * browser never needs to reflow the full list.
               */
              <div style={{ height: totalHeight, position: 'relative' }}>
                {virtualItems.map(({ index, start }) => (
                  <div
                    key={tasks[index].id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${start}px)`,
                      padding: '0 0 8px',
                    }}
                  >
                    <TaskCard task={tasks[index]} onDragStart={onDragStart} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} onDragStart={onDragStart} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

Column.displayName = 'Column';
