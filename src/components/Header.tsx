import { CircleHelp, Download } from 'lucide-react';

export function Header({ isExporting = false, onExportPdf }: { isExporting?: boolean; onExportPdf: () => void }) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Overview</h1>
        <p className="mt-1 text-sm text-slate-700">State of your financial situation</p>
      </div>
      <div className="flex items-center gap-2" data-pdf-exclude="true">
        <button className="glass-control font-semibold" disabled={isExporting} onClick={onExportPdf}>
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </button>
        <button className="glass-icon" aria-label="Help">
          <CircleHelp className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
