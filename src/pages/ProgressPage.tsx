import { useMemo, useState, type ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Coins, TrendingUp, type LucideIcon } from 'lucide-react';
import {
  calculateCurrentWealth,
  calculateMonthlyPlanContribution,
  calculateMonthsTracked,
  calculatePlannedWealth,
  calculateProgressDelta,
  calculateProgressDeltaPercent,
  calculateYearsTracked,
} from '../calculations/progressCalculations';
import { hoverTooltipClasses } from '../constants/tooltipStyles';
import { currency, type FinancialAsset } from '../finance';
import { Header } from '../components/Header';

const PROGRESS_BASELINE_STORAGE_KEY = 'growly-progress-baseline-v1';

type ProgressBaseline = {
  monthLabel: string;
  recordedAt: string;
  totalWealth: number;
};

export function ProgressPage({ assets }: { assets: FinancialAsset[] }) {
  const [baseline, setBaseline] = useState<ProgressBaseline | null>(readSavedProgressBaseline);
  const currentDate = useMemo(() => new Date(), []);
  const currentMonthLabel = formatProgressMonth(currentDate);
  const currentWealth = calculateCurrentWealth(assets);
  const monthlyPlanContribution = calculateMonthlyPlanContribution(assets);
  const monthsTracked = baseline ? calculateMonthsTracked(new Date(baseline.recordedAt), currentDate) : 0;
  const yearsTracked = calculateYearsTracked(monthsTracked);
  const plannedWealth = baseline
    ? calculatePlannedWealth({
      baselineWealth: baseline.totalWealth,
      monthlyPlanContribution,
      monthsTracked,
    })
    : currentWealth;
  const progressDelta = calculateProgressDelta(currentWealth, plannedWealth);
  const progressDeltaPercent = calculateProgressDeltaPercent(currentWealth, plannedWealth);

  function recordBaseline() {
    const nextBaseline = {
      monthLabel: currentMonthLabel,
      recordedAt: currentDate.toISOString(),
      totalWealth: currentWealth,
    };

    setBaseline(nextBaseline);
    saveProgressBaseline(nextBaseline);
  }

  return (
    <>
      <Header
        title="Wealth progress"
        subtitle="Track your actual wealth over time and compare it to your plan"
        showActions={false}
      />
      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <BaselineCard baseline={baseline} currentMonthLabel={currentMonthLabel} onRecord={recordBaseline} />
        <ProgressMetricCard
          icon={TrendingUp}
          iconClassName="bg-emerald-500/12 text-emerald-600"
          title={progressDelta >= 0 ? 'Ahead of Plan' : 'Behind Plan'}
          value={`${formatSignedCurrency(progressDelta)} CHF`}
          helper={`${formatSignedPercent(progressDeltaPercent)} vs plan`}
          helperClassName={progressDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}
        />
        <ProgressMetricCard
          icon={CalendarDays}
          iconClassName="bg-blue-600/10 text-blue-600"
          title="Years Tracked"
          value={yearsTracked.toFixed(1)}
          helper="of your journey"
          helperClassName="text-blue-600"
        />
        <ProgressMetricCard
          icon={Coins}
          iconClassName="bg-amber-500/12 text-amber-500"
          title="Current Wealth"
          value={`${currency(currentWealth)} CHF`}
          helper={`as of ${currentMonthLabel}`}
          helperClassName="text-amber-500"
        />
      </div>
    </>
  );
}

function BaselineCard({
  baseline,
  currentMonthLabel,
  onRecord,
}: {
  baseline: ProgressBaseline | null;
  currentMonthLabel: string;
  onRecord: () => void;
}) {
  return (
    <section className="glass-panel flex w-full max-w-[calc(100vw-3rem)] min-w-0 flex-col p-5 sm:max-w-full">
      <div className="flex items-start gap-4">
        <span className="group relative">
          <button
            className="pulse-red-border grid h-16 w-16 shrink-0 place-items-center rounded-full border border-slate-950 bg-red-50 shadow-inner shadow-red-100/70 transition hover:scale-102 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-500/20"
            aria-describedby="progress-baseline-tooltip"
            aria-label="Start tracking"
            type="button"
            onClick={onRecord}
          >
            <span className="h-7 w-7 rounded-full bg-red-500 shadow-sm shadow-red-500/40" />
          </button>
          <span
            id="progress-baseline-tooltip"
            role="tooltip"
            className={hoverTooltipClasses('bottom-20 left-1/2 w-max -translate-x-1/2 whitespace-nowrap px-3 py-2')}
          >
            Start tracking
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold leading-5 text-slate-950">Progress Baseline</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">{baseline?.monthLabel ?? currentMonthLabel}</p>
          {baseline && (
            <div className="mt-3 flex w-fit items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-500/12 px-3 py-1 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Baseline set
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 max-w-xs wrap-break-word text-sm leading-6 text-slate-700">
        Your asset values of this month are used as the starting point for progress tracking.
      </p>
    </section>
  );
}

function ProgressMetricCard({
  helper,
  icon: Icon,
  iconClassName,
  title,
  value,
  helperClassName,
}: {
  helper: string;
  helperClassName: string;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  value: string;
}) {
  return (
    <section className="glass-panel w-full max-w-[calc(100vw-3rem)] min-w-0 p-5 sm:max-w-full">
      <div className="flex items-start gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-3xl ${iconClassName}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-5 text-slate-950">{title}</h2>
          <p className="mt-6 text-3xl font-bold tracking-normal text-slate-950">
            <MetricValue>{value}</MetricValue>
          </p>
          <p className={`mt-2 text-sm font-bold ${helperClassName}`}>{helper}</p>
        </div>
      </div>
    </section>
  );
}

function MetricValue({ children }: { children: ReactNode }) {
  const [amount, suffix] = String(children).split(' CHF');

  if (!suffix && !String(children).includes('CHF')) {
    return children;
  }

  return (
    <>
      {amount} <span className="text-sm font-bold">CHF</span>
    </>
  );
}

function readSavedProgressBaseline(): ProgressBaseline | null {
  try {
    const savedValue = window.localStorage.getItem(PROGRESS_BASELINE_STORAGE_KEY);
    const baseline = savedValue ? JSON.parse(savedValue) : null;

    return isProgressBaseline(baseline) ? baseline : null;
  } catch {
    return null;
  }
}

function saveProgressBaseline(baseline: ProgressBaseline) {
  try {
    window.localStorage.setItem(PROGRESS_BASELINE_STORAGE_KEY, JSON.stringify(baseline));
  } catch {
    // Keep progress tracking usable when browser storage is unavailable.
  }
}

function isProgressBaseline(value: unknown): value is ProgressBaseline {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const baseline = value as Partial<ProgressBaseline>;

  return (
    typeof baseline.monthLabel === 'string' &&
    typeof baseline.recordedAt === 'string' &&
    typeof baseline.totalWealth === 'number' &&
    Number.isFinite(baseline.totalWealth)
  );
}

function formatProgressMonth(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatSignedCurrency(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';

  return `${sign}${currency(Math.abs(value))}`;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';

  return `${sign}${Math.abs(value).toFixed(1)}%`;
}
