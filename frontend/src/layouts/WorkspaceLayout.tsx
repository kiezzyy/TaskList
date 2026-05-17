import { ReactNode } from 'react';

export function WorkspaceLayout({ sidebar, header, children }: { sidebar: ReactNode; header: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-zinc-200 bg-white lg:w-80 lg:border-b-0 lg:border-r">{sidebar}</aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-zinc-200 bg-white/95 backdrop-blur">{header}</header>
          <section className="flex-1 overflow-auto p-4 sm:p-6">{children}</section>
        </main>
      </div>
    </div>
  );
}
