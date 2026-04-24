import { Task, FilterOptions } from '../types';

/**
 * Pure function: filter a task list by assignee, priority, and/or search term.
 *
 * All active criteria are combined with AND logic:
 *   assignee filter   AND  priority filter  AND  search term
 *
 * Performance note: called inside a useMemo in TaskContext, so it only runs
 * when `tasks` or `filters` changes. For 1000+ tasks the hot path is the
 * early-return chain — each predicate short-circuits as soon as it fails.
 */
export function filterTasks(tasks: Task[], filters: FilterOptions): Task[] {
  const { assignee, priority, searchTerm } = filters;
  const hasPriority = priority && priority.length > 0;
  const term = searchTerm?.toLowerCase().trim();

  return tasks.filter(task => {
    if (assignee && task.assignee !== assignee) return false;
    if (hasPriority && !priority!.includes(task.priority)) return false;
    if (term) {
      if (
        !task.title.toLowerCase().includes(term) &&
        !task.description.toLowerCase().includes(term)
      ) return false;
    }
    return true;
  });
}
