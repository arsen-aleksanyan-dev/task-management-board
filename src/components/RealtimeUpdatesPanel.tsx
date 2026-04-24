import React, { memo, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useActivityContext } from '../context/ActivityContext';

export const RealtimeUpdatesPanel: React.FC = memo(() => {
  const {
    isConnected,
    realtimeUpdates,
    conflicts,
    lastSyncTime,
    startRealtimeSimulation,
    stopRealtimeSimulation,
    resolveConflict,
  } = useActivityContext();

  const [showUpdates, setShowUpdates] = useState(false);

  const pendingConflicts = conflicts.filter(c => c.type === 'pending');
  const resolvedConflicts = conflicts.filter(c => c.type !== 'pending');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <Wifi className="text-green-500" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">Connected</p>
                <p className="text-xs text-gray-500">
                  {lastSyncTime
                    ? `Last update: ${lastSyncTime.toLocaleTimeString()}`
                    : 'Waiting for updates…'}
                </p>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="text-gray-400" size={20} />
              <div>
                <p className="text-sm font-semibold text-gray-800">Disconnected</p>
                <p className="text-xs text-gray-500">Real-time updates paused</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={isConnected ? stopRealtimeSimulation : startRealtimeSimulation}
          className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
            isConnected
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Pending Conflicts — highest priority, always visible */}
      {pendingConflicts.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-yellow-500" size={16} />
            <h3 className="font-semibold text-gray-700 text-sm">
              Merge Conflicts ({pendingConflicts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingConflicts.map((conflict) => {
              // Map back to the original index in the full conflicts array
              const originalIdx = conflicts.indexOf(conflict);
              return (
                <div
                  key={`${conflict.taskId}-${conflict.remoteVersion}`}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <p className="text-xs font-semibold text-yellow-800 mb-1 truncate">
                    "{conflict.taskTitle}"
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    Remote v{conflict.remoteVersion} conflicts with your local v{conflict.localVersion}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveConflict(originalIdx, 'local')}
                      className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium"
                    >
                      Keep Local
                    </button>
                    <button
                      onClick={() => resolveConflict(originalIdx, 'remote')}
                      className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 font-medium"
                    >
                      Take Remote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved Conflicts — collapsed summary */}
      {resolvedConflicts.length > 0 && (
        <div className="mb-4 text-xs text-gray-500">
          {resolvedConflicts.length} conflict{resolvedConflicts.length > 1 ? 's' : ''} resolved
        </div>
      )}

      {/* Recent Updates */}
      <div>
        <button
          onClick={() => setShowUpdates(v => !v)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
        >
          <span className="text-sm font-semibold text-gray-700">
            Recent Updates ({realtimeUpdates.length})
          </span>
          {showUpdates ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {showUpdates && (
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {realtimeUpdates.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No updates yet</p>
            ) : (
              realtimeUpdates.slice(0, 5).map(update => (
                <div
                  key={update.id}
                  className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs"
                >
                  <p className="text-gray-700 font-medium truncate">"{update.taskTitle}"</p>
                  <p className="text-gray-500 mt-0.5">
                    {update.userId} · v{update.version} · {update.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t">
        <p className="text-xs text-gray-400">
          Simulated multi-user environment · updates every 10–15 s
        </p>
      </div>
    </div>
  );
});

RealtimeUpdatesPanel.displayName = 'RealtimeUpdatesPanel';
