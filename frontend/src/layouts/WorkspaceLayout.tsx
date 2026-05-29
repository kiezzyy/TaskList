import { ReactNode } from 'react';

export function WorkspaceLayout({ sidebar, header, children }: { sidebar: ReactNode; header: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-zinc-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-zinc-200 bg-[#fbfbfa] lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">{sidebar}</aside>
        <main className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#fbfbfa]/90 backdrop-blur-xl">{header}</header>
          <section className="flex min-h-0 flex-1 flex-col overflow-auto p-3 sm:p-5">{children}</section>
        </main>
      </div>
    </div>
  );
}
