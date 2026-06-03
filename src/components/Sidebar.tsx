import type { LucideIcon } from 'lucide-react';
import { BarChart3, Layers3, LineChart, PiggyBank, SlidersHorizontal, Target } from 'lucide-react';

const navItems: Array<[string, LucideIcon]> = [
  ['Overview', BarChart3],
  ['Inputs', SlidersHorizontal],
  ['Projections', LineChart],
  ['Breakdown', PiggyBank],
  ['Goals', Target],
  ['Assets', Layers3],
];

export function Sidebar() {
  return (
    <aside className="glass-panel m-0 hidden flex-col border-y-0 border-l-0 px-4 py-5 lg:flex lg:rounded-none">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-normal">Assets</p>
          <p className="text-xs text-slate-600">Financial Calculator</p>
        </div>
      </div>
      <nav className="mt-8 space-y-1.5">
        {navItems.map(([label, Icon], index) => (
          <button
            key={label}
            className={`flex h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition ${index === 0
              ? 'border border-white/70 bg-blue-600/14 text-blue-700 shadow-inner'
              : 'text-slate-700 hover:bg-white/45'
              }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
      <div className="glass-panel mt-auto p-4 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-blue-500/10 text-blue-600">
          <Target className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-900">Small steps today create freedom tomorrow.</p>
        <svg viewBox="0 0 180 58" className="mt-3 h-14 w-full text-violet-500">
          <path d="M2 50 C24 35,30 62,48 45 S78 42,90 33 S124 8,142 24 S165 31,178 14" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </aside>
  );
}
