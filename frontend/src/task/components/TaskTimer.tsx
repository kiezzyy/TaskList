import { Clock3, Play, Square } from 'lucide-react';
import { MouseEvent, useEffect, useState } from 'react';
import { taskStatusNames, timerSettings } from '../../shared/applicationConstants';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Task } from '../services/types';
import { activeElapsedSeconds, formatDuration } from '../utils/time';

export function TaskTimer({ task }: { task: Task }) {
  const { startTimer, stopTimer } = useWorkspaceStore();
  const completed = task.status.name === taskStatusNames.complete;
  const [pending, setPending] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(() => getDisplaySeconds(task));

  useEffect(() => {
    if (pending) {
      return;
    }

    setDisplaySeconds(getDisplaySeconds(task));

    if (!task.activeSession) {
      return;
    }

    const interval = window.setInterval(() => {
      setDisplaySeconds(getDisplaySeconds(task));
    }, timerSettings.tickIntervalMs);
    return () => window.clearInterval(interval);
  }, [pending, task]);

  async function toggleTimer(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (pending || (completed && !task.activeSession)) {
      return;
    }

    setPending(true);
    setDisplaySeconds(getDisplaySeconds(task));
    try {
      if (task.activeSession) {
        await stopTimer(task.id);
        return;
      }
      await startTimer(task.id);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
      <Clock3 size={13} />
      <span className="font-mono tabular-nums">{formatDuration(displaySeconds)}</span>
      <button
        className={`grid h-6 w-6 place-items-center rounded transition ${
          task.activeSession ? 'bg-zinc-900 text-white hover:bg-zinc-700' : completed ? 'bg-zinc-100 text-zinc-300' : 'bg-white text-zinc-700 hover:bg-zinc-100'
        }`}
        title={task.activeSession ? 'Stop timer' : completed ? 'Completed tasks cannot start timers' : 'Start timer'}
        onClick={toggleTimer}
        disabled={pending || (completed && !task.activeSession)}
      >
        {task.activeSession ? <Square size={12} /> : <Play size={12} />}
      </button>
    </div>
  );
}

function getDisplaySeconds(task: Task) {
  return task.totalDurationSeconds + (task.activeSession ? activeElapsedSeconds(task.activeSession.startedAt) : 0);
}
