import { ToastProvider } from './context/ToastContext';
import { TaskProvider } from './context/TaskContext';
import { ActivityProvider } from './context/ActivityContext';
import { Board } from './components/Board';

function App() {
  return (
    <ToastProvider>
      <TaskProvider>
        <ActivityProvider>
          <Board />
        </ActivityProvider>
      </TaskProvider>
    </ToastProvider>
  );
}

export default App;
