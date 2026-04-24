import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Activity, ActivityAction, RealtimeUpdate, ConflictResolution } from '../types/activity';
import { Task, TaskStatus } from '../types';

interface ActivityContextType {
  activities: Activity[];
  realtimeUpdates: RealtimeUpdate[];
  conflicts: ConflictResolution[];
  isConnected: boolean;
  lastSyncTime: Date | null;
  
  // Activity management
  addActivity: (taskId: string, action: ActivityAction, details: string) => void;
  clearActivities: () => void;
  
  // Realtime simulation
  startRealtimeSimulation: () => void;
  stopRealtimeSimulation: () => void;
  
  // Conflict resolution
  resolveConflict: (conflictIndex: number, resolution: 'local' | 'remote') => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const versionRef = useRef<Record<string, number>>({});

  const addActivity = useCallback((taskId: string, action: ActivityAction, details: string) => {
    const activity: Activity = {
      id: Math.random().toString(36).substr(2, 9),
      taskId,
      action,
      details,
      timestamp: new Date(),
      userId: 'current-user',
      optimistic: false,
    };
    setActivities(prev => [activity, ...prev]);
  }, []);

  // Simulate real-time updates from a server
  const startRealtimeSimulation = useCallback(() => {
    setIsConnected(true);
    
    intervalRef.current = setInterval(() => {
      // Simulate random updates from other users
      const userNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
      const randomUser = userNames[Math.floor(Math.random() * userNames.length)];
      const actions: ActivityAction[] = ['update', 'move', 'assign'];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      
      // Only 30% chance of updates to keep it realistic
      if (Math.random() > 0.7) {
        const updateId = Math.random().toString(36).substr(2, 9);
        const taskId = Math.random().toString(36).substr(2, 9);
        const version = (versionRef.current[taskId] || 0) + 1;
        versionRef.current[taskId] = version;
        
        const update: RealtimeUpdate = {
          id: updateId,
          taskId,
          changes: {
            priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
            updatedDate: new Date(),
          },
          timestamp: new Date(),
          userId: randomUser,
          version,
        };
        
        setRealtimeUpdates(prev => {
          const updated = [update, ...prev];
          // Keep only last 20 updates
          return updated.slice(0, 20);
        });
        
        // Add activity log
        const activity: Activity = {
          id: updateId,
          taskId,
          action: randomAction,
          details: `${randomUser} ${randomAction} task`,
          timestamp: new Date(),
          userId: randomUser,
          optimistic: false,
        };
        setActivities(prev => [activity, ...prev].slice(0, 50));
      }
      
      setLastSyncTime(new Date());
    }, 5000); // Update every 5 seconds
  }, []);

  const stopRealtimeSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const resolveConflict = useCallback((conflictIndex: number, resolution: 'local' | 'remote') => {
    const conflict = conflicts[conflictIndex];
    if (conflict) {
      const resolved: ConflictResolution = {
        ...conflict,
        type: resolution,
        resolvedAt: new Date(),
      };
      
      setConflicts(prev => {
        const updated = [...prev];
        updated[conflictIndex] = resolved;
        return updated;
      });
      
      // Add activity log
      addActivity(
        '',
        'update',
        `Conflict resolved: ${resolution} version preferred`
      );
    }
  }, [conflicts, addActivity]);

  const value: ActivityContextType = {
    activities,
    realtimeUpdates,
    conflicts,
    isConnected,
    lastSyncTime,
    addActivity,
    clearActivities: () => setActivities([]),
    startRealtimeSimulation,
    stopRealtimeSimulation,
    resolveConflict,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityContext = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivityContext must be used within ActivityProvider');
  }
  return context;
};
