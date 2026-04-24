import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Activity, ActivityAction, RealtimeUpdate, ConflictResolution } from '../types/activity';
import { Task, TaskStatus } from '../types';
import { useTaskContext } from './TaskContext';
import { useToastContext } from './ToastContext';

interface ActivityContextType {
  activities: Activity[];
  realtimeUpdates: RealtimeUpdate[];
  conflicts: ConflictResolution[];
  isConnected: boolean;
  lastSyncTime: Date | null;
  addActivity: (taskId: string, action: ActivityAction, details: string) => void;
  clearActivities: () => void;
  startRealtimeSimulation: () => void;
  stopRealtimeSimulation: () => void;
  resolveConflict: (conflictIndex: number, resolution: 'local' | 'remote') => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const SIMULATED_USERS = ['Diana', 'Eve', 'Frank', 'Grace'];
const REMOTE_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tasks, updateTask, pendingTasks } = useTaskContext();
  const { addToast } = useToastContext();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [realtimeUpdates, setRealtimeUpdates] = useState<RealtimeUpdate[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(false);
  // Refs keep simulation callbacks free of stale closure issues
  const tasksRef = useRef<Task[]>([]);
  const pendingTasksRef = useRef<Set<string>>(new Set());
  // Tracks version numbers we've assigned to remote updates per task
  const remoteVersionRef = useRef<Record<string, number>>({});

  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { pendingTasksRef.current = pendingTasks; }, [pendingTasks]);

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
    setActivities(prev => [activity, ...prev].slice(0, 50));
  }, []);

  /**
   * Real-time simulation tick.
   *
   * Picks a real task and moves it to a random status. If the same task is
   * currently undergoing an optimistic local update (in pendingTasks), we
   * record a conflict and ask the user to resolve it rather than silently
   * overwriting their in-flight change.
   *
   * Reconciliation strategy (last-writer-wins with user override):
   * - No conflict  → apply remote change immediately
   * - Conflict     → surface to UI, default keep-local; user can flip to remote
   *
   * This ref-based approach is updated on every render so the closure always
   * sees current tasks and pendingTasks without extra dependencies.
   */
  const simulationRef = useRef<() => void>();
  simulationRef.current = () => {
    if (!isConnectedRef.current) return;

    const currentTasks = tasksRef.current;
    if (currentTasks.length === 0) {
      scheduleNextTick();
      return;
    }

    const randomUser = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)];
    const targetTask = currentTasks[Math.floor(Math.random() * currentTasks.length)];
    const newStatus = REMOTE_STATUSES[Math.floor(Math.random() * REMOTE_STATUSES.length)];

    // Skip no-op moves
    if (newStatus === targetTask.status) {
      scheduleNextTick();
      return;
    }

    const remoteVersion = (remoteVersionRef.current[targetTask.id] ?? targetTask.version) + 1;
    remoteVersionRef.current[targetTask.id] = remoteVersion;
    const remoteChanges: Record<string, unknown> = { status: newStatus, version: remoteVersion };

    if (pendingTasksRef.current.has(targetTask.id)) {
      // Conflict: user's optimistic update is still in-flight
      const conflict: ConflictResolution = {
        taskId: targetTask.id,
        taskTitle: targetTask.title,
        type: 'pending',
        localVersion: targetTask.version,
        remoteVersion,
        remoteChanges,
      };
      setConflicts(prev => [conflict, ...prev].slice(0, 5));
      addToast(`Conflict: ${randomUser} also moved "${targetTask.title}"`, 'warning');
    } else {
      // No conflict — apply remote change and notify
      updateTask(targetTask.id, remoteChanges as Partial<typeof targetTask>);

      setRealtimeUpdates(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          taskId: targetTask.id,
          taskTitle: targetTask.title,
          changes: remoteChanges,
          timestamp: new Date(),
          userId: randomUser,
          version: remoteVersion,
        },
        ...prev,
      ].slice(0, 20));

      setActivities(prev => [
        {
          id: Math.random().toString(36).substr(2, 9),
          taskId: targetTask.id,
          action: 'move' as ActivityAction,
          details: `${randomUser} moved "${targetTask.title}" → ${newStatus}`,
          timestamp: new Date(),
          userId: randomUser,
          optimistic: false,
        },
        ...prev,
      ].slice(0, 50));

      addToast(`${randomUser} moved "${targetTask.title}" → ${newStatus}`, 'info');
      setLastSyncTime(new Date());
    }

    scheduleNextTick();
  };

  // Schedule next simulation tick with a random 10–15 s interval
  const scheduleNextTick = () => {
    if (!isConnectedRef.current) return;
    const delay = 10000 + Math.random() * 5000;
    timeoutRef.current = setTimeout(() => simulationRef.current?.(), delay);
  };

  const startRealtimeSimulation = useCallback(() => {
    if (isConnectedRef.current) return;
    isConnectedRef.current = true;
    setIsConnected(true);
    scheduleNextTick();
  }, []);

  const stopRealtimeSimulation = useCallback(() => {
    isConnectedRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resolveConflict = useCallback((conflictIndex: number, resolution: 'local' | 'remote') => {
    setConflicts(prev => {
      const conflict = prev[conflictIndex];
      if (!conflict || conflict.type !== 'pending') return prev;

      if (resolution === 'remote') {
        updateTask(conflict.taskId, conflict.remoteChanges as Parameters<typeof updateTask>[1]);
        addToast(`Applied remote changes for "${conflict.taskTitle}"`, 'info');
      } else {
        addToast(`Kept local changes for "${conflict.taskTitle}"`, 'success');
      }

      const updated = [...prev];
      updated[conflictIndex] = { ...conflict, type: resolution, resolvedAt: new Date() };
      return updated;
    });
  }, [updateTask, addToast]);

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
  if (!context) throw new Error('useActivityContext must be used within ActivityProvider');
  return context;
};
