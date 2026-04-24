import { ToastProvider } from './context/ToastContext';
import { TaskProvider } from './context/TaskContext';
import { ActivityProvider } from './context/ActivityContext';
import { Board } from './components/Board';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <TaskProvider>
          <ActivityProvider>
            <ErrorBoundary>
              <Board />
            </ErrorBoundary>
          </ActivityProvider>
        </TaskProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
