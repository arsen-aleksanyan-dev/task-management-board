import { TaskProvider } from './context/TaskContext';
import { ActivityProvider } from './context/ActivityContext';
import { Board } from './components/Board';

function App() {
  return (
    <TaskProvider>
      <ActivityProvider>
        <Board />
      </ActivityProvider>
    </TaskProvider>
  );
}

export default App;
