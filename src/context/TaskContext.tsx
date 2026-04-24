import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Task, TaskContextType, FilterOptions, TaskStatus, TaskPriority } from '../types';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Activity context is optional - only used if provided
const ActivityContextOptional = React.createContext<any>(undefined);
export const ActivityContextProvider = ActivityContextOptional.Provider;

// Hook to safely get activity context (returns null if not available)
const useActivityContextOptional = () => {
  try {
    return useContext(ActivityContextOptional);
  } catch {
    return null;
  }
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Setup project structure',
      description: 'Initialize React project with TypeScript and Tailwind CSS',
      status: 'done',
      priority: 'high',
      assignee: 'Alice',
      tags: ['setup', 'infrastructure'],
      createdDate: new Date('2024-01-01'),
      updatedDate: new Date('2024-01-02'),
    },
    {
      id: '2',
      title: 'Create task components',
      description: 'Build TaskCard, Column, and Board components',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Bob',
      tags: ['development', 'ui'],
      createdDate: new Date('2024-01-02'),
      updatedDate: new Date('2024-01-03'),
    },
    {
      id: '3',
      title: 'Implement filtering',
      description: 'Add filter functionality for assignee, priority, and search',
      status: 'todo',
      priority: 'medium',
      assignee: 'Alice',
      tags: ['feature'],
      createdDate: new Date('2024-01-03'),
      updatedDate: new Date('2024-01-03'),
    },
    {
      id: '4',
      title: 'Add drag and drop',
      description: 'Implement drag-and-drop between columns',
      status: 'todo',
      priority: 'high',
      assignee: 'Charlie',
      tags: ['feature', 'interaction'],
      createdDate: new Date('2024-01-03'),
      updatedDate: new Date('2024-01-03'),
    },
  ]);

  const [filters, setFilters] = useState<FilterOptions>({});

  // Get unique assignees from tasks
  const assignees = useMemo(() => {
    const unique = Array.from(new Set(tasks.map(t => t.assignee)));
    return unique.sort();
  }, [tasks]);

  // Filter tasks based on current filter options
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.assignee && task.assignee !== filters.assignee) return false;
      
      if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
        return false;
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(term);
        const matchesDescription = task.description.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDescription) return false;
      }
      
      return true;
    });
  }, [tasks, filters]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdDate: new Date(),
      updatedDate: new Date(),
    };
    setTasks(prev => [newTask, ...prev]);
    
    // Log activity
    const activityContext = useActivityContextOptional();
    if (activityContext) {
      activityContext.addActivity(newTask.id, 'create', `Task created: "${newTask.title}"`);
    }
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    let changeDetails = '';
    
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          // Track what changed
          if (updates.priority && updates.priority !== task.priority) {
            changeDetails += `Priority changed to ${updates.priority}. `;
          }
          if (updates.assignee && updates.assignee !== task.assignee) {
            changeDetails += `Reassigned to ${updates.assignee}. `;
          }
          if (updates.title && updates.title !== task.title) {
            changeDetails += `Title updated. `;
          }
          return { ...task, ...updates, updatedDate: new Date() };
        }
        return task;
      })
    );
    
    // Log activity
    const activityContext = useActivityContextOptional();
    if (activityContext && changeDetails) {
      activityContext.addActivity(id, 'update', changeDetails.trim());
    }
  }, []);

  const deleteTask = useCallback((id: string) => {
    // Get task info before deleting for logging
    const taskToDelete = tasks.find(t => t.id === id);
    
    setTasks(prev => prev.filter(task => task.id !== id));
    
    // Log activity
    const activityContext = useActivityContextOptional();
    if (activityContext && taskToDelete) {
      activityContext.addActivity(id, 'delete', `Task deleted: "${taskToDelete.title}"`);
    }
  }, [tasks]);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    // Get task info before updating for logging
    const task = tasks.find(t => t.id === taskId);
    
    updateTask(taskId, { status: newStatus });
    
    // Log activity
    const activityContext = useActivityContextOptional();
    if (activityContext && task && task.status !== newStatus) {
      activityContext.addActivity(taskId, 'move', `Task moved from ${task.status} to ${newStatus}`);
    }
  }, [tasks, updateTask]);

  const value: TaskContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    filters,
    setFilters,
    filteredTasks,
    assignees,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within TaskProvider');
  }
  return context;
};
