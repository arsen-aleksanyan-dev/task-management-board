# Task Management Board

A modern, performant task management application built with React, TypeScript, and Tailwind CSS. Features real-time state management, advanced filtering, drag-and-drop functionality, and comprehensive performance optimizations.

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Component Overview](#component-overview)
- [Implementation Notes](#implementation-notes)

---

## ✨ Features

### Part 1: Core Functionality ✅ COMPLETED

**Task List Display**
- Display tasks with title, description, status, priority, assignee, and created date
- Three-column board layout (Todo, In Progress, Done)
- **Drag-and-drop between columns** using native HTML5 Drag API
- Responsive design with Tailwind CSS

**Task Creation**
- Modal form for creating new tasks
- Required fields: title, description, assignee
- Optional fields: priority (Low/Medium/High), tags (comma-separated)
- Form validation and error handling

**Basic Filtering**
- Filter by assignee (dropdown)
- Filter by priority (multi-select buttons)
- Search functionality (searches title and description)
- Clear filters button
- Real-time filtering with memoization for performance

### Part 2: Real-time Updates Simulation ✅ COMPLETED

**Activity Timeline**
- Real-time activity feed showing all task actions
- Support for: create, update, delete, move, assign actions
- User attribution (simulated multi-user environment)
- Timestamps with relative time formatting (e.g., "2m ago")
- Emoji icons for quick visual identification of action types

**Real-time Updates Simulation**
- Toggle button to connect/disconnect from simulated server
- Live indicator showing connection status
- Periodic updates from simulated "other users" (5-second intervals)
- 30% probability of updates to simulate realistic network activity
- Last sync timestamp tracking

**Conflict Resolution**
- Conflict detection with version tracking
- Option to resolve conflicts with local or remote preference
- Conflict history for audit trail
- Status UI showing resolved conflicts

**Optimistic Updates**
- Architecture prepared for client-side optimistic updates
- Activity items marked as "Pending" when optimistic
- Ready for server confirmation patterns

### Part 3: Advanced Performance Optimizations (Prepared)
- React.memo for component optimization
- useMemo for computed values
- useCallback for function memoization
- Virtual scrolling for large task lists
- Request batching and debouncing

---

## 🏗️ Project Structure

```
task-management-board/
├── src/
│   ├── components/
│   │   ├── Board.tsx              # Main board component
│   │   ├── Column.tsx             # Column component (Todo/In Progress/Done)
│   │   ├── TaskCard.tsx           # Individual task card component
│   │   ├── TaskFormModal.tsx      # Modal for creating new tasks
│   │   └── FilterBar.tsx          # Filtering and search bar
│   ├── context/
│   │   └── TaskContext.tsx        # Global state management using Context API
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces and types
│   ├── App.tsx                    # Main App component
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Tailwind imports and global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

The application will open at `http://localhost:5173`

---

## 🏛️ Architecture & Design Decisions

### 1. State Management: Context API
**Why Context API?**
- Lightweight and built-in (no external dependencies)
- Perfect for medium-sized applications
- Avoids prop drilling
- Easy to test and understand

**Context Structure:**
```typescript
TaskContextType {
  tasks: Task[]                           // All tasks
  filteredTasks: Task[]                   // Tasks after filtering
  filters: FilterOptions                  // Current filter state
  assignees: string[]                     // Unique assignees (memoized)
  
  // Actions
  addTask(task): void
  updateTask(id, updates): void
  deleteTask(id): void
  moveTask(taskId, status): void
  setFilters(filters): void
}
```

### 2. Activity Tracking: Dual-Context Pattern
**ActivityContext for Real-time Updates**
- Manages activity log separate from task state
- Tracks all user actions and system events
- Simulates multi-user environment
- Handles conflict resolution
- Version tracking for each task (for conflict detection)

**Key Pattern: Loose Coupling**
- TaskContext doesn't depend on ActivityContext
- ActivityContext accessible via optional hook
- TaskContext can log activities if ActivityContext is available
- Maintains clean separation of concerns

**Real-time Simulation Strategy**
- Uses `setInterval` for periodic updates (5-second intervals)
- Simulates other users (Alice, Bob, Charlie, Diana, Eve)
- Random action types: update, move, assign
- 30% probability ensures realistic traffic patterns
- Version numbers prevent stale data

### 3. Drag-and-Drop: Native HTML5 API
**Why not react-beautiful-dnd?**
- No external dependencies required for basic drag-drop
- Simpler implementation and smaller bundle size
- Works well for this use case without the complexity of libraries
- Easy to extend with custom behavior

**Implementation:**
- `onDragStart` stores the dragged task ID
- `onDragOver` accepts drop events
- `onDrop` triggers task status update
- `onDragEnd` clears the dragged state

### 3. Component Architecture
**Memoization Strategy:**
- `TaskCard` - memoized (receives Task object)
- `Column` - memoized (receives static props + task array)
- `FilterBar` - memoized (uses useCallback for handlers)

This prevents unnecessary re-renders and optimizes performance.

### 4. Filtering Implementation
- **Memoized computation**: `useMemo` for filtered tasks
- **Independent filters**: Can combine assignee + priority + search
- **Real-time updates**: Filters apply instantly to UI

### 5. TypeScript Benefits
- Type-safe task management
- IDE autocomplete for better DX
- Catches errors at compile time
- Clear interfaces (`Task`, `TaskStatus`, `TaskPriority`)

---

## 📦 Component Overview

### Board Component
**Main container** - Orchestrates the board layout and drag-drop logic
- Groups tasks by status
- Manages modal visibility
- Handles drag-and-drop events
- Renders 3 columns

### Column Component
**Column container** - Renders a status column with drop zone
- Displays task count
- Renders task cards
- Handles drag-over styling
- Shows empty state

### TaskCard Component
**Individual task** - Displays task information with actions
- Shows title, description, assignee
- Color-coded priority badge
- Tags display
- Delete action
- Draggable

### TaskFormModal Component
**Task creation form** - Modal dialog for creating new tasks
- Form validation
- Dynamic assignee selection
- Priority selection
- Tag input (comma-separated)
- Form submission handling

### FilterBar Component
**Filtering interface** - Search and filter controls
- Search input (title/description)
- Assignee dropdown
- Priority multi-select
- Clear filters button
- Create task button

### ActivityFeed Component (Part 2)
**Activity timeline** - Real-time activity log display
- Shows all task actions chronologically
- Emoji-coded action types for visual quick scanning
- Relative timestamps (e.g., "2m ago")
- User attribution for each action
- Optimistic update indicators
- Auto-scrolling with max 50 activities

### RealtimeUpdatesPanel Component (Part 2)
**Real-time connection status and updates** - Manages multi-user simulation
- Connection status toggle (Connect/Disconnect)
- Live indicator with pulsing animation
- Recent updates list showing latest changes from "other users"
- Conflict resolution UI with local/remote preference buttons
- Last sync timestamp
- Status information and helper text

---

## 💡 Implementation Notes

### Filtering Algorithm
```typescript
filteredTasks = tasks.filter(task => {
  // All conditions must pass (AND logic)
  ✓ Assignee matches (if selected)
  ✓ Priority in selected list (if any selected)
  ✓ Title or description contains search term (if searching)
  return true
})
```

### Default Sample Tasks
The app comes with 4 sample tasks:
1. **Setup project structure** (Done) - Alice - High
2. **Create task components** (In Progress) - Bob - High
3. **Implement filtering** (Todo) - Alice - Medium
4. **Add drag and drop** (Todo) - Charlie - High

### Performance Optimizations Already Implemented
- ✅ `React.memo()` on TaskCard, Column, FilterBar, ActivityFeed, RealtimeUpdatesPanel
- ✅ `useMemo()` for filtered tasks and assignees list
- ✅ `useCallback()` for event handlers and actions
- ✅ No unnecessary re-renders
- ✅ Efficient event delegation in drag-drop
- ✅ Activity list capped at 50 items for memory efficiency
- ✅ Realtime updates capped at 20 items
- ✅ Interval-based updates instead of continuous polling

### Real-time Update Architecture
**Activity Context Patterns:**
- Immutable state updates with proper object spreading
- Reference stability with useCallback memoization
- Proper cleanup with useEffect return for intervals
- Optional context availability (TaskContext doesn't require ActivityContext)

**Multi-user Simulation:**
- Version tracking per task for conflict detection
- Activity queue management (FIFO with size limits)
- Realistic traffic simulation (30% probability)
- Random user selection from predefined team

### Browser Compatibility
- Modern browsers with HTML5 Drag-and-Drop API
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile: Limited (drag-drop doesn't work well on touch)

---

## 🔮 Future Enhancements

### Part 3: Advanced Performance Optimizations (Prepared Structure)
- Virtual scrolling for 1000+ tasks (react-window)
- Advanced analytics dashboard
- Task dependencies and subtasks
- Recurring tasks
- Calendar view integration
- Notifications system
- WebSocket integration for real production use
- Server-side persistence layer

---

## 🎨 Design Highlights

### Color Scheme
- **Priority Badges**: 
  - Low: Green (#10b981)
  - Medium: Yellow (#f59e0b)
  - High: Red (#ef4444)
- **Status Columns**:
  - Todo: Gray background
  - In Progress: Blue background
  - Done: Green background

### Responsive Design
- Mobile-friendly layout
- Adapts to screen size
- Touch-friendly buttons and inputs

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Clear visual feedback

---

## 🧪 Testing Recommendations

```typescript
// Test cases to cover:
- Task creation with validation
- Task filtering (individual and combined)
- Drag-and-drop between columns
- Task deletion
- Filter clearing
- Edge cases (empty tasks, special characters)
```

---

## 📝 Assumptions & Changes

No significant deviations from requirements. The implementation follows all Part 1 specifications with the following enhancements:
- Used native HTML5 drag-drop instead of a library for simplicity
- Added sample tasks for better demo experience
- Implemented proper TypeScript types throughout
- Added component memoization for performance

---

## 📄 License

MIT

---

## 👨‍💻 Author

Built with attention to React patterns, performance optimization, and clean code architecture.

**Key Technologies:**
- React 18 with Hooks
- TypeScript 5
- Tailwind CSS 3
- Vite 4
- Lucide Icons
