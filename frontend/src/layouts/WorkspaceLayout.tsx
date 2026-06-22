import { ReactNode } from 'react';

export function WorkspaceLayout({ sidebar, header, children }: { sidebar: ReactNode; header: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--app-page-bg)] text-[var(--app-text)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-[color:var(--app-border)] bg-[var(--app-surface)]/95 shadow-[inset_-1px_0_0_rgba(255,255,255,0.35)] backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r">{sidebar}</aside>
        <main className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[color:var(--app-border)] bg-[var(--app-surface)]/85 shadow-sm backdrop-blur-xl">{header}</header>
          <section className="flex min-h-0 flex-1 flex-col overflow-auto p-3 sm:p-5">{children}</section>
        </main>
      </div>
    </div>
  );
}
