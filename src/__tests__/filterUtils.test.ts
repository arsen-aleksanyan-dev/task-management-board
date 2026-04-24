import { describe, it, expect } from 'vitest';
import { filterTasks } from '../utils/filterUtils';
import { Task } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: Math.random().toString(36).substr(2, 6),
    title: 'Default task',
    description: 'Default description',
    status: 'todo',
    priority: 'medium',
    assignee: 'Alice',
    createdDate: new Date(),
    updatedDate: new Date(),
    version: 1,
    ...overrides,
  };
}

const tasks: Task[] = [
  makeTask({ id: 'a', title: 'Auth service bug',   assignee: 'Alice',   priority: 'high',   status: 'todo' }),
  makeTask({ id: 'b', title: 'Dashboard redesign', assignee: 'Bob',     priority: 'medium', status: 'in-progress', description: 'urgent redesign' }),
  makeTask({ id: 'c', title: 'Write unit tests',   assignee: 'Alice',   priority: 'low',    status: 'done' }),
  makeTask({ id: 'd', title: 'Deploy to staging',  assignee: 'Charlie', priority: 'high',   status: 'todo' }),
];

// ── No filters ────────────────────────────────────────────────────────────────

describe('filterTasks', () => {
  it('returns all tasks when no filter criteria are set', () => {
    expect(filterTasks(tasks, {})).toHaveLength(4);
  });

  it('returns all tasks when filter object has empty/undefined values', () => {
    expect(filterTasks(tasks, { assignee: undefined, priority: [], searchTerm: '' })).toHaveLength(4);
  });

  // ── Assignee filter ─────────────────────────────────────────────────────────

  it('filters by assignee — returns only matching tasks', () => {
    const result = filterTasks(tasks, { assignee: 'Alice' });
    expect(result.map(t => t.id)).toEqual(['a', 'c']);
  });

  it('returns an empty list when no tasks match the assignee', () => {
    expect(filterTasks(tasks, { assignee: 'Nobody' })).toHaveLength(0);
  });

  // ── Priority filter ─────────────────────────────────────────────────────────

  it('filters by a single priority', () => {
    const result = filterTasks(tasks, { priority: ['high'] });
    expect(result.map(t => t.id)).toEqual(['a', 'd']);
  });

  it('filters by multiple priorities using OR logic within the priority list', () => {
    const result = filterTasks(tasks, { priority: ['high', 'low'] });
    expect(result.map(t => t.id)).toEqual(['a', 'c', 'd']);
  });

  it('ignores an empty priority array (treats it as "no filter")', () => {
    expect(filterTasks(tasks, { priority: [] })).toHaveLength(4);
  });

  // ── Search term ─────────────────────────────────────────────────────────────

  it('matches tasks whose title contains the search term (case-insensitive)', () => {
    const result = filterTasks(tasks, { searchTerm: 'auth' });
    expect(result.map(t => t.id)).toEqual(['a']);
  });

  it('matches tasks whose description contains the search term', () => {
    const result = filterTasks(tasks, { searchTerm: 'urgent' });
    expect(result.map(t => t.id)).toEqual(['b']);
  });

  it('is case-insensitive for search', () => {
    expect(filterTasks(tasks, { searchTerm: 'UNIT' })).toHaveLength(1);
    expect(filterTasks(tasks, { searchTerm: 'unit' })).toHaveLength(1);
  });

  it('returns an empty list when search term matches nothing', () => {
    expect(filterTasks(tasks, { searchTerm: 'xyzzy123' })).toHaveLength(0);
  });

  // ── Combined filters (AND logic) ────────────────────────────────────────────

  it('combines assignee AND priority with AND logic', () => {
    // Alice + high priority → only task 'a'
    const result = filterTasks(tasks, { assignee: 'Alice', priority: ['high'] });
    expect(result.map(t => t.id)).toEqual(['a']);
  });

  it('combines all three criteria with AND logic', () => {
    // 'deploy' appears in task 'd'; but assignee is Charlie + high priority
    const result = filterTasks(tasks, {
      assignee: 'Charlie',
      priority: ['high'],
      searchTerm: 'deploy',
    });
    expect(result.map(t => t.id)).toEqual(['d']);
  });

  it('returns empty when criteria are mutually exclusive', () => {
    // No Alice task has priority 'low' AND matches 'auth'
    const result = filterTasks(tasks, {
      assignee: 'Alice',
      priority: ['low'],
      searchTerm: 'auth', // task 'a' is high priority, task 'c' doesn't match 'auth'
    });
    expect(result).toHaveLength(0);
  });

  // ── Edge cases ───────────────────────────────────────────────────────────────

  it('returns an empty list when the input is empty', () => {
    expect(filterTasks([], { assignee: 'Alice' })).toHaveLength(0);
  });

  it('handles a whitespace-only search term as no filter', () => {
    expect(filterTasks(tasks, { searchTerm: '   ' })).toHaveLength(4);
  });
});
