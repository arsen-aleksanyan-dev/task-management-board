export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'move'
  | 'assign';

export interface Activity {
  id: string;
  taskId: string;
  action: ActivityAction;
  details: string;
  timestamp: Date;
  userId: string;
  optimistic?: boolean;
}

export interface ActivityUpdate {
  taskId: string;
  action: ActivityAction;
  details: string;
  userId: string;
}

export interface RealtimeUpdate {
  id: string;
  taskId: string;
  taskTitle: string;
  changes: Record<string, unknown>;
  timestamp: Date;
  userId: string;
  version: number;
}

export interface ConflictResolution {
  taskId: string;
  taskTitle: string;
  // 'pending' = awaiting user decision; 'local'/'remote' = resolved
  type: 'local' | 'remote' | 'merged' | 'pending';
  resolvedAt?: Date;
  localVersion: number;
  remoteVersion: number;
  // The remote changes to apply if the user picks "Take Remote"
  remoteChanges: Record<string, unknown>;
}
