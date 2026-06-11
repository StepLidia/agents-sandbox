import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function YearPicker({
  className = '',
  id,
  selectedYear,
  onYearChange,
}: {
  className?: string;
  id: string;
  selectedYear: number;
  onYearChange: (year: number) => void;
}) {
  const [visibleStartYear, setVisibleStartYear] = useState(() => getYearPickerStart(selectedYear));
  const years = Array.from({ length: 12 }, (_, index) => visibleStartYear + index);

  return (
    <div
      id={id}
      className={`absolute z-50 w-72 rounded-lg border border-slate-300/50 bg-white p-3 shadow-xl shadow-slate-500/20 ${className}`}
    >
      <div className="flex items-center justify-between">
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-700"
          aria-label="Previous years"
          type="button"
          onClick={() => setVisibleStartYear((year) => year - 12)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-slate-950">
          {visibleStartYear}-{visibleStartYear + 11}
        </p>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-700"
          aria-label="Next years"
          type="button"
          onClick={() => setVisibleStartYear((year) => year + 12)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {years.map((year) => {
          const isSelected = year === selectedYear;

          return (
            <button
              key={year}
              className={`h-9 rounded-lg text-sm font-semibold transition ${isSelected
                ? 'bg-blue-600/14 text-blue-700 shadow-inner'
                : 'text-slate-700 hover:bg-blue-500/10 hover:text-blue-700'
                }`}
              type="button"
              onClick={() => onYearChange(year)}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getYearPickerStart(year: number) {
  return Math.floor(year / 12) * 12;
}
