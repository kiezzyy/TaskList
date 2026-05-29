import { ChevronDown, Clock3, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../../task/hooks/useWorkspaceStore';
import { ActivityEvent, TaskList } from '../../task/services/types';
import { formatDateTime } from '../../task/utils/time';

export function ActivityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { history, lists } = useWorkspaceStore();
  const groupedHistory = useMemo(() => groupHistoryByList(history, lists), [history, lists]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <aside
        className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-zinc-200 bg-white shadow-2xl shadow-zinc-950/20 animate-in slide-in-from-right duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">History</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">Workspace activity</h2>
          </div>
          <button className="grid h-9 w-9 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950" title="Close panel" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="grid gap-3">
            {groupedHistory.map((group) => (
              <HistoryGroup key={group.id} group={group} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function HistoryGroup({ group }: { group: { id: string; name: string; events: ActivityEvent[] } }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white">
      <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-zinc-50" onClick={() => setExpanded((value) => !value)}>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-zinc-950">{group.name}</span>
          <span className="text-xs text-zinc-500">{group.events.length} activity events</span>
        </span>
        <ChevronDown className={`shrink-0 text-zinc-400 transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`} size={17} />
      </button>
      <div className={`grid overflow-hidden transition-all duration-200 ease-out ${expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-2 border-t border-zinc-100 p-3">
          {group.events.map((event) => (
            <div key={event.id} className="rounded-md bg-zinc-50 p-3 text-sm">
              <div className="flex items-start gap-2">
                <Clock3 className="mt-0.5 shrink-0 text-zinc-400" size={14} />
                <div className="min-w-0">
                  <p className="text-zinc-800">{event.message}</p>
                  <p className="mt-1 text-xs text-zinc-500">{formatDateTime(event.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
          {group.events.length === 0 ? <p className="px-1 py-2 text-sm text-zinc-500">No activity recorded for this tab yet.</p> : null}
        </div>
      </div>
    </section>
  );
}

function groupHistoryByList(history: ActivityEvent[], lists: TaskList[]) {
  const groups = lists.map((list) => ({
    id: list.id,
    name: list.name,
    events: history.filter((event) => belongsToList(event, list.id))
  }));
  const workspaceEvents = history.filter((event) => !lists.some((list) => belongsToList(event, list.id)));
  return workspaceEvents.length ? [...groups, { id: 'workspace', name: 'Workspace events', events: workspaceEvents }] : groups;
}

function belongsToList(event: ActivityEvent, listId: string) {
  const payload = parsePayload(event);
  return payload?.listId === listId || (event.entity === 'task_list' && event.entityId === listId);
}

function parsePayload(item: { payload?: string | null }) {
  if (!item.payload) {
    return null;
  }
  try {
    return JSON.parse(item.payload) as { listId?: string };
  } catch {
    return null;
  }
}
