import { Archive, Clock } from 'lucide-react';
import { useWorkspaceStore } from '../../task/hooks/useWorkspaceStore';
import { formatDateTime } from '../../task/utils/time';

export function ActivityPanel() {
  const { history, recycleBin } = useWorkspaceStore();

  return (
    <div id="activity" className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/60">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={16} />
          <h3 className="font-semibold">Activity History</h3>
        </div>
        <div className="max-h-72 space-y-2 overflow-auto">
          {history.map((event) => (
            <div key={event.id} className="rounded-md bg-zinc-50 p-3 text-sm">
              <p>{event.message}</p>
              <p className="mt-1 text-xs text-zinc-500">{formatDateTime(event.createdAt)}</p>
            </div>
          ))}
          {history.length === 0 ? <p className="text-sm text-zinc-500">No activity recorded yet.</p> : null}
        </div>
      </section>
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-200/60">
        <div className="mb-3 flex items-center gap-2">
          <Archive size={16} />
          <h3 className="font-semibold">Recovery</h3>
        </div>
        <div className="max-h-72 space-y-2 overflow-auto">
          {recycleBin.map((item) => (
            <div key={item.id} className="rounded-md bg-zinc-50 p-3 text-sm">
              <p>{item.label}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {item.entity} deleted {formatDateTime(item.deletedAt)}
              </p>
            </div>
          ))}
          {recycleBin.length === 0 ? <p className="text-sm text-zinc-500">Deleted items will appear here before permanent cleanup.</p> : null}
        </div>
      </section>
    </div>
  );
}
