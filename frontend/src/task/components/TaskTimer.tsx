import { Clock3, Play, Square } from 'lucide-react';
import { MouseEvent, useEffect, useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Task } from '../services/types';
import { activeElapsedSeconds, formatDuration } from '../utils/time';

export function TaskTimer({ task }: { task: Task }) {
  const { startTimer, stopTimer } = useWorkspaceStore();
  const completed = task.status.name === 'Complete';
  const [activeSeconds, setActiveSeconds] = useState(() => (task.activeSession ? activeElapsedSeconds(task.activeSession.startedAt) : 0));

  useEffect(() => {
    if (!task.activeSession) {
      setActiveSeconds(0);
      return;
    }
    const interval = window.setInterval(() => {
      setActiveSeconds(activeElapsedSeconds(task.activeSession?.startedAt ?? task.updatedAt));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [task.activeSession, task.updatedAt]);

  async function toggleTimer(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (task.activeSession) {
      await stopTimer(task.id);
      return;
    }
    if (completed) {
      return;
    }
    await startTimer(task.id);
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
      <Clock3 size={13} />
      <span className="font-mono tabular-nums">{formatDuration(task.totalDurationSeconds + activeSeconds)}</span>
      <button
        className={`grid h-6 w-6 place-items-center rounded transition ${
          task.activeSession ? 'bg-zinc-900 text-white hover:bg-zinc-700' : completed ? 'bg-zinc-100 text-zinc-300' : 'bg-white text-zinc-700 hover:bg-zinc-100'
        }`}
        title={task.activeSession ? 'Stop timer' : completed ? 'Completed tasks cannot start timers' : 'Start timer'}
        onClick={toggleTimer}
        disabled={completed && !task.activeSession}
      >
        {task.activeSession ? <Square size={12} /> : <Play size={12} />}
      </button>
    </div>
  );
}
