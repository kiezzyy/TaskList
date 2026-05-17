import { Pause, Play, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Task } from '../services/types';
import { activeElapsedSeconds, formatDuration } from '../utils/time';

export function TimerControls({ task }: { task: Task }) {
  const { pauseTimer, resumeTimer, startTimer, stopTimer } = useWorkspaceStore();
  const [tick, setTick] = useState(0);
  const activeSeconds = task.activeSession ? activeElapsedSeconds(task.activeSession.startedAt) : 0;

  useEffect(() => {
    if (!task.activeSession) {
      return;
    }
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [task.activeSession]);

  useEffect(() => {
    setTick(0);
  }, [task.activeSession?.id]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-sm">
        {formatDuration(task.totalDurationSeconds + activeSeconds)}
      </span>
      {task.activeSession ? (
        <>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-300" title="Pause timer" onClick={() => pauseTimer(task.id)}>
            <Pause size={15} />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-300" title="Stop timer" onClick={() => stopTimer(task.id)}>
            <Square size={15} />
          </button>
        </>
      ) : (
        <button className="grid h-8 w-8 place-items-center rounded-md bg-zinc-950 text-white" title="Start or resume timer" onClick={() => (task.sessions.length ? resumeTimer(task.id) : startTimer(task.id))}>
          <Play size={15} />
        </button>
      )}
    </div>
  );
}
