import React, { memo } from 'react';
import { Activity } from 'lucide-react';
import { useActivityContext } from '../context/ActivityContext';

export const ActivityFeed: React.FC = memo(() => {
  const { activities, isConnected, lastSyncTime } = useActivityContext();

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return '✨';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'move':
        return '→';
      case 'assign':
        return '👤';
      default:
        return '•';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Activity size={20} />
          Activity Feed
        </h3>
        <div className="flex items-center gap-2">
          {isConnected && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No activities yet</p>
          </div>
        ) : (
          activities.map(activity => (
            <div
              key={activity.id}
              className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-sm"
            >
              <span className="text-lg flex-shrink-0">{getActionIcon(activity.action)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-700">
                  <span className="font-medium">{activity.userId}</span> {activity.details}
                </p>
                <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
              </div>
              {activity.optimistic && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded flex-shrink-0">
                  Pending
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="mt-3 pt-3 border-t text-xs text-gray-500 text-center">
          Last sync: {lastSyncTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
});

ActivityFeed.displayName = 'ActivityFeed';
