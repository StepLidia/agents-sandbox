import { BarChart3, CircleUserRound, Footprints, ReceiptText, X } from 'lucide-react';

export type DashboardView = 'overview' | 'expenses' | 'contact';

const navItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'contact', label: 'Contact', icon: CircleUserRound },
] satisfies Array<{ id: DashboardView; label: string; icon: typeof BarChart3 }>;

type SidebarProps = {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
};

type MobileSidebarDrawerProps = SidebarProps & {
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="glass-panel glass-panel-square m-0 hidden flex-col border-y-0 border-l-0 px-4 py-5 md:flex">
      <SidebarContent activeView={activeView} onViewChange={onViewChange} />
    </aside>
  );
}

export function MobileSidebarDrawer({ activeView, isOpen, onClose, onViewChange }: MobileSidebarDrawerProps) {
  function handleViewChange(view: DashboardView) {
    onViewChange(view);
    onClose();
  }

  return (
    <div className={`fixed inset-0 z-40 md:hidden ${isOpen ? '' : 'pointer-events-none'}`}>
      <button
        aria-label="Close navigation"
        className={`absolute inset-0 bg-slate-950/50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        type="button"
        onClick={onClose}
      />
      <aside
        className={`glass-panel glass-panel-square fixed inset-y-0 left-0 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-y-0 border-l-0 px-4 py-5 shadow-2xl transition-transform duration-200 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <button
          aria-label="Close navigation"
          className="absolute right-4 grid h-10 w-10 place-items-center rounded-lg text-slate-700 transition hover:bg-white/45"
          type="button"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent activeView={activeView} onViewChange={handleViewChange} />
      </aside>
    </div>
  );
}

function SidebarContent({ activeView, onViewChange }: SidebarProps) {
  return (
    <>
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/25">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-normal">Growly</p>
          <p className="text-xs text-slate-600">Financial Calculator</p>
        </div>
      </div>
      <nav className="mt-8 space-y-1.5">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={label}
            className={`flex h-11 w-full items-center gap-3 rounded-lg px-4 text-sm font-semibold transition ${activeView === id
              ? 'border border-slate-300/30 bg-blue-600/14 text-blue-700 shadow-inner'
              : 'text-slate-700 hover:bg-white/45'
              }`}
            type="button"
            onClick={() => onViewChange(id)}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>
      <div className="glass-panel mt-10 p-4 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-blue-500/10 text-blue-600">
          <Footprints className="h-6 w-6" />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-900">Small steps today create freedom tomorrow.</p>
        <svg viewBox="0 0 180 58" className="mt-3 h-14 w-full text-violet-500">
          <path d="M2 50 C24 35,30 62,48 45 S78 42,90 33 S124 8,142 24 S165 31,178 14" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </>
  );
}
