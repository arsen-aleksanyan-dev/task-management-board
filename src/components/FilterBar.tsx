import React, { memo, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';
import { TaskPriority } from '../types';

interface FilterBarProps {
  onCreateTask: () => void;
}

const priorityOptions: TaskPriority[] = ['low', 'medium', 'high'];

export const FilterBar: React.FC<FilterBarProps> = memo(({ onCreateTask }) => {
  const { filters, setFilters, assignees } = useTaskContext();

  const handleSearchChange = useCallback((value: string) => {
    setFilters({ ...filters, searchTerm: value });
  }, [filters, setFilters]);

  const handleAssigneeChange = useCallback((value: string) => {
    setFilters({ ...filters, assignee: value || undefined });
  }, [filters, setFilters]);

  const handlePriorityChange = useCallback(
    (priority: TaskPriority) => {
      const current = filters.priority || [];
      const updated = current.includes(priority)
        ? current.filter(p => p !== priority)
        : [...current, priority];
      setFilters({ ...filters, priority: updated.length > 0 ? updated : undefined });
    },
    [filters, setFilters]
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  const hasActiveFilters = Boolean(
    filters.searchTerm || filters.assignee || (filters.priority && filters.priority.length > 0)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={filters.searchTerm || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onCreateTask}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium whitespace-nowrap"
          >
            + New Task
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Assignee Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Assignee</label>
            <select
              value={filters.assignee || ''}
              onChange={(e) => handleAssigneeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All assignees</option>
              {assignees.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Priority</label>
            <div className="flex gap-2">
              {priorityOptions.map(priority => (
                <button
                  key={priority}
                  onClick={() => handlePriorityChange(priority)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filters.priority?.includes(priority)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium text-sm"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

FilterBar.displayName = 'FilterBar';
