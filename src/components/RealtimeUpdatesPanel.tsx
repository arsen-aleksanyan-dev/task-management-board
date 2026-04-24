import React, { memo, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useActivityContext } from '../context/ActivityContext';

export const RealtimeUpdatesPanel: React.FC = memo(() => {
  const {
    isConnected,
    realtimeUpdates,
    conflicts,
    startRealtimeSimulation,
    stopRealtimeSimulation,
    resolveConflict,
  } = useActivityContext();

  const [showDetails, setShowDetails] = useState(false);

  const handleToggleSimulation = () => {
    if (isConnected) {
      stopRealtimeSimulation();
    } else {
      startRealtimeSimulation();
    }
  };

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
                <p className="text-xs text-gray-500">Receiving real-time updates</p>
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
          onClick={handleToggleSimulation}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            isConnected
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Recent Updates */}
      <div className="mb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
        >
          <h3 className="font-semibold text-gray-700">Recent Updates ({realtimeUpdates.length})</h3>
          <span className="text-xs text-gray-500">{showDetails ? '▼' : '▶'}</span>
        </button>

        {showDetails && (
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {realtimeUpdates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No updates received yet</p>
            ) : (
              realtimeUpdates.slice(0, 5).map(update => (
                <div
                  key={update.id}
                  className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
                >
                  <p className="text-gray-700">
                    <span className="font-medium">{update.userId}</span> updated task
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    v{update.version} • {update.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-yellow-500" size={18} />
            <h3 className="font-semibold text-gray-700">Conflicts ({conflicts.length})</h3>
          </div>
          <div className="space-y-2">
            {conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <p className="text-sm text-gray-700 mb-2">
                  Merge conflict detected between local v{conflict.localVersion} and remote
                  v{conflict.remoteVersion}
                </p>
                {conflict.type === 'local' && (
                  <p className="text-xs text-green-600 mb-2">✓ Resolved: Using local version</p>
                )}
                {conflict.type === 'remote' && (
                  <p className="text-xs text-blue-600 mb-2">✓ Resolved: Using remote version</p>
                )}
                {!conflict.type && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => resolveConflict(idx, 'local')}
                      className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium"
                    >
                      Keep Local
                    </button>
                    <button
                      onClick={() => resolveConflict(idx, 'remote')}
                      className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 font-medium"
                    >
                      Take Remote
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          <span className="font-semibold">Status:</span> Simulating multi-user environment with
          periodic updates and conflict resolution
        </p>
      </div>
    </div>
  );
});

RealtimeUpdatesPanel.displayName = 'RealtimeUpdatesPanel';
