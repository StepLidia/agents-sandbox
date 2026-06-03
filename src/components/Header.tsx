import { CircleHelp, Download } from 'lucide-react';

export function Header() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Overview</h1>
        <p className="mt-1 text-sm text-slate-700">Plan today. Live better tomorrow.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="glass-control font-semibold">
          <Download className="h-4 w-4" />
          Export Report
        </button>
        <button className="glass-icon" aria-label="Help">
          <CircleHelp className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
