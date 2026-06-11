import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type MonthPickerMonth = {
  key: string;
  shortLabel: string;
};

export function MonthPicker<TMonth extends MonthPickerMonth>({
  buildMonth,
  className,
  id,
  selectedMonth,
  onMonthChange,
}: {
  buildMonth: (year: number, monthIndex: number) => TMonth;
  className?: string;
  id: string;
  selectedMonth: TMonth;
  onMonthChange: (month: TMonth) => void;
}) {
  const [visibleYear, setVisibleYear] = useState(() => getMonthYear(selectedMonth));
  const selectedMonthNumber = getMonthNumber(selectedMonth);
  const months = Array.from({ length: 12 }, (_, index) => buildMonth(visibleYear, index));

  return (
    <div
      id={id}
      className={`absolute z-50 w-72 rounded-lg border border-slate-300/30 bg-white/95 p-3 shadow-xl shadow-slate-400/20 backdrop-blur-xl ${className ?? ''}`}
    >
      <div className="flex items-center justify-between">
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-700"
          aria-label="Previous year"
          type="button"
          onClick={() => setVisibleYear((year) => year - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-slate-950">{visibleYear}</p>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-700"
          aria-label="Next year"
          type="button"
          onClick={() => setVisibleYear((year) => year + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {months.map((month) => {
          const isSelected = visibleYear === getMonthYear(selectedMonth) && selectedMonthNumber === getMonthNumber(month);

          return (
            <button
              key={month.key}
              className={`h-9 rounded-lg text-sm font-semibold transition ${isSelected
                ? 'bg-blue-600/14 text-blue-700 shadow-inner'
                : 'text-slate-700 hover:bg-blue-500/10 hover:text-blue-700'
                }`}
              type="button"
              onClick={() => onMonthChange(month)}
            >
              {month.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getMonthYear(month: MonthPickerMonth) {
  return Number(month.key.slice(0, 4));
}

function getMonthNumber(month: MonthPickerMonth) {
  return Number(month.key.slice(5, 7));
}
