import { Task } from '../services/types';
import { formatDateTime, formatDuration } from '../utils/time';

export function SessionTimeline({ task }: { task: Task }) {
  if (task.sessions.length === 0) {
    return <p className="text-xs text-zinc-500">No work sessions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {task.sessions.slice(0, 4).map((session) => (
        <div key={session.id} className="grid gap-1 rounded bg-zinc-50 p-2 text-xs text-zinc-600 sm:grid-cols-[1fr_auto]">
          <span>
            {formatDateTime(session.startedAt)} to {session.endedAt ? formatDateTime(session.endedAt) : 'now'}
          </span>
          <span className="font-mono">{formatDuration(session.durationSeconds)}</span>
        </div>
      ))}
    </div>
  );
}
