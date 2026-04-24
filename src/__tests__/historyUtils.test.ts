import { describe, it, expect } from 'vitest';
import {
  pushToHistory,
  stepBackHistory,
  stepForwardHistory,
  applyUndo,
  applyRedo,
  MAX_HISTORY,
} from '../utils/historyUtils';
import { HistoryEntry, HistoryState } from '../types/history';
import { Task } from '../types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const emptyState: HistoryState = { stack: [], index: -1 };

function makeTask(overrides?: Partial<Task>): Task {
  return {
    id: 't1',
    title: 'Test task',
    description: 'desc',
    status: 'todo',
    priority: 'medium',
    assignee: 'Alice',
    createdDate: new Date('2024-01-01'),
    updatedDate: new Date('2024-01-01'),
    version: 1,
    ...overrides,
  };
}

function makeEntry(overrides?: Partial<HistoryEntry>): HistoryEntry {
  const task = makeTask();
  return {
    id: 'e1',
    timestamp: new Date(),
    description: 'Created "Test task"',
    type: 'add',
    taskId: task.id,
    taskTitle: task.title,
    before: null,
    after: task,
    ...overrides,
  };
}

// ── pushToHistory ─────────────────────────────────────────────────────────────

describe('pushToHistory', () => {
  it('adds the first entry and sets index to 0', () => {
    const entry = makeEntry();
    const next = pushToHistory(emptyState, entry);

    expect(next.stack).toHaveLength(1);
    expect(next.index).toBe(0);
    expect(next.stack[0]).toBe(entry);
  });

  it('appends entries and advances the index', () => {
    const e1 = makeEntry({ id: 'e1' });
    const e2 = makeEntry({ id: 'e2' });
    const s1 = pushToHistory(emptyState, e1);
    const s2 = pushToHistory(s1, e2);

    expect(s2.stack).toHaveLength(2);
    expect(s2.index).toBe(1);
  });

  it('truncates the redo branch when a new action is pushed after undo', () => {
    const e1 = makeEntry({ id: 'e1' });
    const e2 = makeEntry({ id: 'e2' });
    const e3 = makeEntry({ id: 'e3' });

    let state = pushToHistory(emptyState, e1);
    state = pushToHistory(state, e2);
    // Simulate undo: move index back by 1
    state = stepBackHistory(state); // index = 0
    // Push a new entry — e2 (the redo branch) should be dropped
    state = pushToHistory(state, e3);

    expect(state.stack).toHaveLength(2);
    expect(state.stack.map(e => e.id)).toEqual(['e1', 'e3']);
    expect(state.index).toBe(1);
  });

  it(`trims the oldest entry when the stack exceeds ${MAX_HISTORY} items`, () => {
    let state = emptyState;
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      state = pushToHistory(state, makeEntry({ id: `e${i}` }));
    }
    expect(state.stack).toHaveLength(MAX_HISTORY);
    expect(state.index).toBe(MAX_HISTORY - 1);
    // The oldest 5 entries should have been trimmed
    expect(state.stack[0].id).toBe('e5');
  });
});

// ── stepBackHistory / stepForwardHistory ─────────────────────────────────────

describe('stepBackHistory', () => {
  it('decrements the index', () => {
    const s = { stack: [makeEntry()], index: 0 };
    expect(stepBackHistory(s).index).toBe(-1);
  });

  it('is a no-op when already at the beginning', () => {
    expect(stepBackHistory(emptyState)).toEqual(emptyState);
  });
});

describe('stepForwardHistory', () => {
  it('increments the index', () => {
    const e1 = makeEntry({ id: 'e1' });
    const e2 = makeEntry({ id: 'e2' });
    const s = { stack: [e1, e2], index: 0 };
    expect(stepForwardHistory(s).index).toBe(1);
  });

  it('is a no-op when already at the end', () => {
    const s = { stack: [makeEntry()], index: 0 };
    expect(stepForwardHistory(s)).toEqual(s);
  });
});

// ── applyUndo ─────────────────────────────────────────────────────────────────

describe('applyUndo', () => {
  it("undoes 'add' by removing the task", () => {
    const task = makeTask();
    const tasks = [task];
    const entry = makeEntry({ type: 'add', taskId: task.id, before: null, after: task });

    const result = applyUndo(tasks, entry);
    expect(result).toHaveLength(0);
  });

  it("undoes 'delete' by restoring the task at the front of the list", () => {
    const task = makeTask();
    const other = makeTask({ id: 't2', title: 'Other' });
    const tasks = [other]; // task was deleted, so it's absent
    const entry = makeEntry({ type: 'delete', taskId: task.id, before: task, after: null });

    const result = applyUndo(tasks, entry)!;
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(task); // restored at front
  });

  it("undoes 'move' by restoring the before-snapshot", () => {
    const before = makeTask({ status: 'todo', version: 1 });
    const after = makeTask({ status: 'done', version: 2 });
    const tasks = [after]; // currently at 'done'
    const entry = makeEntry({ type: 'move', taskId: before.id, before, after });

    const result = applyUndo(tasks, entry)!;
    expect(result[0].status).toBe('todo');
    expect(result[0].version).toBe(1);
  });

  it("undoes 'update' by restoring the before-snapshot", () => {
    const before = makeTask({ priority: 'low' });
    const after = makeTask({ priority: 'high' });
    const tasks = [after];
    const entry = makeEntry({ type: 'update', taskId: before.id, before, after });

    const result = applyUndo(tasks, entry)!;
    expect(result[0].priority).toBe('low');
  });

  it('returns null when the task to undo a move on no longer exists', () => {
    const before = makeTask();
    const entry = makeEntry({ type: 'move', taskId: 'missing-id', before, after: before });
    expect(applyUndo([], entry)).toBeNull();
  });
});

// ── applyRedo ─────────────────────────────────────────────────────────────────

describe('applyRedo', () => {
  it("redoes 'add' by reinserting the task", () => {
    const task = makeTask();
    const tasks: Task[] = []; // task was undone (removed)
    const entry = makeEntry({ type: 'add', taskId: task.id, before: null, after: task });

    const result = applyRedo(tasks, entry)!;
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(task);
  });

  it("redoes 'delete' by removing the task again", () => {
    const task = makeTask();
    const tasks = [task]; // task was restored by undo
    const entry = makeEntry({ type: 'delete', taskId: task.id, before: task, after: null });

    const result = applyRedo(tasks, entry)!;
    expect(result).toHaveLength(0);
  });

  it("redoes 'move' by applying the after-snapshot", () => {
    const before = makeTask({ status: 'todo' });
    const after = makeTask({ status: 'done', version: 2 });
    const tasks = [before]; // currently back at 'todo' after undo
    const entry = makeEntry({ type: 'move', taskId: before.id, before, after });

    const result = applyRedo(tasks, entry)!;
    expect(result[0].status).toBe('done');
  });

  it('returns null when the task to redo a move on no longer exists', () => {
    const before = makeTask();
    const entry = makeEntry({ type: 'move', taskId: 'missing', before, after: before });
    expect(applyRedo([], entry)).toBeNull();
  });
});
