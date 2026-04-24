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
  optimistic?: boolean; // For tracking optimistic updates
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
  changes: Record<string, any>;
  timestamp: Date;
  userId: string;
  version: number; // For conflict resolution
}

export interface ConflictResolution {
  type: 'local' | 'remote' | 'merged';
  resolvedAt: Date;
  localVersion: number;
  remoteVersion: number;
}
