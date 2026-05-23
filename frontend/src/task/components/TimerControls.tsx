import { Pause, Play, Square } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../hooks/useWorkspaceStore';
import { Subtask, Task } from '../services/types';
import { activeElapsedSeconds, formatDuration } from '../utils/time';

export function TimerControls({ item, target }: { item: Task | Subtask; target: 'task' | 'subtask' }) {
  const { pauseTimer, pauseSubtaskTimer, resumeTimer, resumeSubtaskTimer, startTimer, startSubtaskTimer, stopTimer, stopSubtaskTimer } = useWorkspaceStore();
  const [tick, setTick] = useState(0);
  const activeSeconds = item.activeSession ? activeElapsedSeconds(item.activeSession.startedAt) : 0;

  useEffect(() => {
    if (!item.activeSession) {
      return;
    }
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [item.activeSession]);

  useEffect(() => {
    setTick(0);
  }, [item.activeSession?.id]);

  const controls =
    target === 'task'
      ? { start: startTimer, pause: pauseTimer, resume: resumeTimer, stop: stopTimer }
      : { start: startSubtaskTimer, pause: pauseSubtaskTimer, resume: resumeSubtaskTimer, stop: stopSubtaskTimer };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded bg-zinc-100 px-2 py-1 font-mono text-xs">
        {formatDuration(item.totalDurationSeconds + activeSeconds)}
      </span>
      {item.activeSession ? (
        <>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Pause timer" onClick={() => controls.pause(item.id)}>
            <Pause size={15} />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50" title="Stop timer" onClick={() => controls.stop(item.id)}>
            <Square size={15} />
          </button>
        </>
      ) : (
        <button className="grid h-8 w-8 place-items-center rounded-md bg-zinc-950 text-white hover:bg-zinc-800" title="Start or resume timer" onClick={() => (item.sessions.length ? controls.resume(item.id) : controls.start(item.id))}>
          <Play size={15} />
        </button>
      )}
    </div>
  );
}
