import React, { memo } from 'react';
import { Undo2, Redo2, History, Clock } from 'lucide-react';
import { useTaskContext } from '../context/TaskContext';

/**
 * Toolbar row that shows undo/redo buttons and a compact history panel.
 *
 * Re-render notes:
 * - Wrapped in React.memo; only re-renders when the relevant TaskContext
 *   slices change (canUndo, canRedo, undoDescription, redoDescription, history).
 * - The full history list is shown in a collapsible panel (not always rendered)
 *   so long stacks don't create DOM pressure.
 */
export const UndoRedoBar: React.FC = memo(() => {
  const {
    canUndo, canRedo,
    undo, redo,
    undoDescription, redoDescription,
    history, historyIndex,
    pendingTasks,
  } = useTaskContext();

  const isPending = pendingTasks.size > 0;
  const [showHistory, setShowHistory] = React.useState(false);

  const isMac = typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().includes('MAC');
  const mod = isMac ? '⌘' : 'Ctrl';

  return (
    <div className="flex items-center gap-2 relative">
      {/* Undo button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        title={
          isPending
            ? 'Undo disabled — save in progress'
            : undoDescription
              ? `Undo: ${undoDescription} (${mod}+Z)`
              : `Nothing to undo (${mod}+Z)`
        }
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
          canUndo
            ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
            : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
      >
        <Undo2 size={14} />
        <span>Undo</span>
      </button>

      {/* Redo button */}
      <button
        onClick={redo}
        disabled={!canRedo}
        title={
          isPending
            ? 'Redo disabled — save in progress'
            : redoDescription
              ? `Redo: ${redoDescription} (${mod}+Shift+Z)`
              : `Nothing to redo (${mod}+Shift+Z)`
        }
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
          canRedo
            ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
            : 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
      >
        <Redo2 size={14} />
        <span>Redo</span>
      </button>

      {/* Inline description of what will be undone */}
      {canUndo && undoDescription && (
        <span className="hidden sm:block text-xs text-gray-400 max-w-[180px] truncate" title={undoDescription}>
          ↩ {undoDescription}
        </span>
      )}

      {/* History panel toggle */}
      {history.length > 0 && (
        <div className="relative ml-1">
          <button
            onClick={() => setShowHistory(v => !v)}
            title="View action history"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors border ${
              showHistory
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <History size={14} />
            <span className="font-medium tabular-nums">
              {historyIndex + 1}/{history.length}
            </span>
          </button>

          {/* Dropdown history list */}
          {showHistory && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-lg border border-gray-200 shadow-xl z-40 overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Action History
                </span>
                <span className="text-xs text-gray-400">
                  {history.length}/{50} entries
                </span>
              </div>
              <ul className="max-h-64 overflow-y-auto">
                {[...history].reverse().map((entry, reversedIdx) => {
                  const originalIdx = history.length - 1 - reversedIdx;
                  const isHead = originalIdx === historyIndex;
                  const isUndone = originalIdx > historyIndex;
                  return (
                    <li
                      key={entry.id}
                      className={`flex items-start gap-2.5 px-3 py-2 text-xs border-b border-gray-50 ${
                        isHead
                          ? 'bg-blue-50'
                          : isUndone
                            ? 'opacity-40'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex-shrink-0 mt-0.5">
                        {getEntryIcon(entry.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`truncate font-medium ${isHead ? 'text-blue-700' : 'text-gray-700'}`}>
                          {entry.description}
                        </p>
                        <p className="text-gray-400 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(entry.timestamp)}
                          {isHead && (
                            <span className="ml-1 bg-blue-100 text-blue-600 px-1 rounded text-[10px] font-semibold">
                              HEAD
                            </span>
                          )}
                          {isUndone && (
                            <span className="ml-1 text-gray-300 text-[10px]">undone</span>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Pending indicator */}
      {isPending && (
        <span className="text-xs text-amber-600 font-medium">
          saving…
        </span>
      )}
    </div>
  );
});

UndoRedoBar.displayName = 'UndoRedoBar';

function getEntryIcon(type: string): string {
  switch (type) {
    case 'add': return '✨';
    case 'delete': return '🗑️';
    case 'move': return '→';
    case 'update': return '✏️';
    default: return '•';
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  if (s < 60) return 'just now';
  if (m < 60) return `${m}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
