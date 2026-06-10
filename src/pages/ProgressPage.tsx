import { useMemo, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Info,
  ListChecks,
  Pencil,
  RefreshCcw,
  Save,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { colorClasses } from '../constants/colors';
import { buttonClasses } from '../constants/buttonStyles';
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
import { useEditableNumber } from '../hooks/useEditableNumber';

const PROGRESS_BASELINE_STORAGE_KEY = 'growly-progress-baseline-v1';
const PROGRESS_MONTHLY_RECORD_STORAGE_KEY = 'growly-progress-monthly-record-v1';

type ProgressBaseline = {
  monthLabel: string;
  recordedAt: string;
  totalWealth: number;
};

type ProgressMonth = {
  key: string;
  label: string;
  shortLabel: string;
};

type ProgressMonthlyRecord = {
  monthLabel: string;
  recordedAt: string;
  balances: Record<string, number>;
};

export function ProgressPage({ assets }: { assets: FinancialAsset[] }) {
  const [baseline, setBaseline] = useState<ProgressBaseline | null>(readSavedProgressBaseline);
  const [monthlyRecord, setMonthlyRecord] = useState<ProgressMonthlyRecord | null>(readSavedProgressMonthlyRecord);
  const [assetBalances, setAssetBalances] = useState(() => getInitialProgressAssetBalances(assets, monthlyRecord));
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

  function updateAssetBalance(assetId: string, value: number) {
    setAssetBalances((currentBalances) => ({
      ...currentBalances,
      [assetId]: value,
    }));
  }

  function saveMonthlyRecord() {
    const nextRecord = {
      monthLabel: currentMonthLabel,
      recordedAt: currentDate.toISOString(),
      balances: assetBalances,
    };

    setMonthlyRecord(nextRecord);
    saveProgressMonthlyRecord(nextRecord);
  }

  return (
    <>
      <Header
        title="Wealth progress"
        subtitle="Track your actual wealth over time and compare it to your plan"
        showActions={false}
      />
      <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <BaselineCard
          baseline={baseline}
          currentMonthLabel={currentMonthLabel}
          currentWealth={currentWealth}
          onBaselineChange={(nextBaseline) => {
            setBaseline(nextBaseline);
            saveProgressBaseline(nextBaseline);
          }}
          onRecord={recordBaseline}
        />
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
      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-5">
        <MonthlyAssetBalancesCard
          assets={assets}
          balances={assetBalances}
          className="md:col-span-3"
          currentMonthLabel={currentMonthLabel}
          savedMonthLabel={monthlyRecord?.monthLabel}
          onBalanceChange={updateAssetBalance}
          onSave={saveMonthlyRecord}
        />
        <HowProgressWorksCard className="md:col-span-2" />
      </div>
    </>
  );
}

function BaselineCard({
  baseline,
  currentMonthLabel,
  currentWealth,
  onBaselineChange,
  onRecord,
}: {
  baseline: ProgressBaseline | null;
  currentMonthLabel: string;
  currentWealth: number;
  onBaselineChange: (baseline: ProgressBaseline) => void;
  onRecord: () => void;
}) {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const selectedMonth = baseline ? getProgressMonthFromDate(new Date(baseline.recordedAt)) : getCurrentProgressMonth();

  function resetBaselineMonth(month: ProgressMonth) {
    onBaselineChange({
      monthLabel: month.label,
      recordedAt: getProgressMonthDate(month).toISOString(),
      totalWealth: currentWealth,
    });
    setIsMonthPickerOpen(false);
  }

  return (
    <section className={`glass-panel flex w-full max-w-[calc(100vw-3rem)] min-w-0 flex-col p-5 sm:max-w-full ${isMonthPickerOpen ? 'z-30' : ''}`}>
      <div className="glass-panel-floating-layer flex items-start gap-4">
        <span className="group relative">
          <button
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border bg-white transition hover:scale-102 hover:bg-white focus:outline-none focus:ring-4 ${baseline
              ? 'border-blue-300 text-blue-700 shadow-sm shadow-blue-500/15 focus:ring-blue-500/20'
              : 'pulse-red-border border-slate-950 focus:ring-red-500/20'
              }`}
            aria-controls={baseline ? 'progress-baseline-month-picker' : undefined}
            aria-describedby="progress-baseline-tooltip"
            aria-expanded={baseline ? isMonthPickerOpen : undefined}
            aria-label={baseline ? 'Reset baseline' : 'Start tracking'}
            type="button"
            onClick={baseline ? () => setIsMonthPickerOpen((isOpen) => !isOpen) : onRecord}
          >
            {baseline ? (
              <RefreshCcw className="h-7 w-7" />
            ) : (
              <span className="h-7 w-7 rounded-full bg-red-500 shadow-sm shadow-red-500/40" />
            )}
          </button>
          {baseline && isMonthPickerOpen && (
            <ProgressMonthPicker
              selectedMonth={selectedMonth}
              onMonthChange={resetBaselineMonth}
            />
          )}
          <span
            id="progress-baseline-tooltip"
            role="tooltip"
            className={hoverTooltipClasses('bottom-20 left-1/2 w-max -translate-x-1/2 whitespace-nowrap px-3 py-2')}
          >
            {baseline ? 'Reset baseline' : 'Start tracking'}
          </span>
        </span>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-5 text-slate-950">{baseline ? 'Started' : 'Start'}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-600">{baseline?.monthLabel ?? currentMonthLabel}</p>
          </div>
          {baseline && (
            <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-500/12 px-3 py-1 text-sm font-bold text-emerald-700">
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

function ProgressMonthPicker({
  selectedMonth,
  onMonthChange,
}: {
  selectedMonth: ProgressMonth;
  onMonthChange: (month: ProgressMonth) => void;
}) {
  const [visibleYear, setVisibleYear] = useState(() => Number(selectedMonth.key.slice(0, 4)));
  const selectedMonthNumber = Number(selectedMonth.key.slice(5, 7));
  const months = Array.from({ length: 12 }, (_, index) => buildProgressMonth(visibleYear, index));

  return (
    <div
      id="progress-baseline-month-picker"
      className="absolute left-0 top-20 z-50 w-72 rounded-lg border border-slate-300/30 bg-white/95 p-3 shadow-xl shadow-slate-400/20 backdrop-blur-xl"
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
          const isSelected = visibleYear === Number(selectedMonth.key.slice(0, 4)) && selectedMonthNumber === Number(month.key.slice(5, 7));

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

function MonthlyAssetBalancesCard({
  assets,
  balances,
  className = '',
  currentMonthLabel,
  savedMonthLabel,
  onBalanceChange,
  onSave,
}: {
  assets: FinancialAsset[];
  balances: Record<string, number>;
  className?: string;
  currentMonthLabel: string;
  savedMonthLabel?: string;
  onBalanceChange: (assetId: string, value: number) => void;
  onSave: () => void;
}) {
  return (
    <section className={`glass-panel w-full max-w-[calc(100vw-3rem)] min-w-0 p-5 sm:max-w-full ${className}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl border ${colorClasses.violet.border} ${colorClasses.violet.bg} ${colorClasses.violet.text}`}>
          <Pencil className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-950">Record Current Month ({currentMonthLabel})</h2>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">
        Enter your current asset balances to save your progress.
      </p>
      <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {assets.map((asset) => (
          <ProgressAssetBalanceField
            key={asset.id}
            asset={asset}
            value={balances[asset.id] ?? asset.amount}
            onChange={(value) => onBalanceChange(asset.id, value)}
          />
        ))}
      </div>
      <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          {savedMonthLabel ? `Last saved for ${savedMonthLabel}` : 'No monthly record saved yet'}
        </p>
        <button
          className={buttonClasses()}
          type="button"
          onClick={onSave}
        >
          <Save className="h-4 w-4" />
          Save
        </button>
      </div>
    </section>
  );
}

function ProgressAssetBalanceField({
  asset,
  value,
  onChange,
}: {
  asset: FinancialAsset;
  value: number;
  onChange: (value: number) => void;
}) {
  const colors = colorClasses[asset.color];
  const { inputValue, onInputChange } = useEditableNumber(value, onChange, { format: 'money' });

  return (
    <label className="flex min-w-0 flex-col gap-2 rounded-lg border border-slate-300/30 bg-white/20 p-3">
      <span className="flex min-w-0 items-center justify-end gap-2 text-sm font-bold text-slate-700">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.bg} ring-4 ring-white`} style={{ backgroundColor: colors.stroke }} />
        <span className="min-w-0">
          <span className="block truncate">{asset.label}</span>
        </span>
      </span>
      <span className="glass-input flex w-full min-w-0 items-center gap-2 py-2 text-sm">
        <input
          aria-label={`${asset.label} current balance`}
          className="min-w-0 flex-1 bg-transparent text-right font-black text-slate-950 outline-none"
          inputMode="numeric"
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.currentTarget.value)}
        />
        <span className="font-semibold text-slate-600">CHF</span>
      </span>
    </label>
  );
}

function HowProgressWorksCard({ className = '' }: { className?: string }) {
  const steps = [
    {
      color: colorClasses.blue.text,
      icon: CalendarCheck2,
      label: 'Set a baseline month',
    },
    {
      color: colorClasses.violet.text,
      icon: ListChecks,
      label: 'Add your actual balances each month',
    },
    {
      color: colorClasses.emerald.text,
      icon: TrendingUp,
      label: 'Compare actual vs. projected wealth',
    },
    {
      color: colorClasses.coral.text,
      icon: Sparkles,
      label: 'Stay on track and achieve your goals',
    },
  ];

  return (
    <section className={`glass-panel flex h-full w-full max-w-[calc(100vw-3rem)] min-w-0 flex-col p-5 sm:max-w-full ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl border ${colorClasses.cyan.border} ${colorClasses.cyan.bg} ${colorClasses.cyan.text}`}>
          <Info className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-bold text-slate-950">How it works</h2>
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-2">
        {steps.map(({ color, icon: Icon, label }) => (
          <div key={label} className="flex min-w-0 items-center gap-3 text-sm text-slate-700">
            <span className="grid h-9 w-9 shrink-0 place-items-center">
              <Icon className={`h-5 w-5 ${color}`} />
            </span>
            <span className="min-w-0">{label}</span>
          </div>
        ))}
      </div>
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

function readSavedProgressMonthlyRecord(): ProgressMonthlyRecord | null {
  try {
    const savedValue = window.localStorage.getItem(PROGRESS_MONTHLY_RECORD_STORAGE_KEY);
    const record = savedValue ? JSON.parse(savedValue) : null;

    return isProgressMonthlyRecord(record) ? record : null;
  } catch {
    return null;
  }
}

function saveProgressMonthlyRecord(record: ProgressMonthlyRecord) {
  try {
    window.localStorage.setItem(PROGRESS_MONTHLY_RECORD_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Keep monthly recording usable when browser storage is unavailable.
  }
}

function getInitialProgressAssetBalances(assets: FinancialAsset[], savedRecord: ProgressMonthlyRecord | null) {
  return Object.fromEntries(
    assets.map((asset) => [
      asset.id,
      getSavedProgressBalance(savedRecord?.balances[asset.id], asset.amount),
    ]),
  );
}

function getSavedProgressBalance(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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

function isProgressMonthlyRecord(value: unknown): value is ProgressMonthlyRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<ProgressMonthlyRecord>;

  return (
    typeof record.monthLabel === 'string' &&
    typeof record.recordedAt === 'string' &&
    isProgressBalanceRecord(record.balances)
  );
}

function isProgressBalanceRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every((balance) => typeof balance === 'number' && Number.isFinite(balance));
}

function formatProgressMonth(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function getCurrentProgressMonth() {
  const currentDate = new Date();

  return buildProgressMonth(currentDate.getFullYear(), currentDate.getMonth());
}

function getProgressMonthFromDate(date: Date) {
  return buildProgressMonth(date.getFullYear(), date.getMonth());
}

function buildProgressMonth(year: number, monthIndex: number): ProgressMonth {
  const date = new Date(year, monthIndex, 1);

  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    label: formatProgressMonth(date),
    shortLabel: date.toLocaleDateString('en-US', {
      month: 'short',
    }),
  };
}

function getProgressMonthDate(month: ProgressMonth) {
  const [year, monthNumber] = month.key.split('-').map(Number);

  return new Date(year, monthNumber - 1, 1);
}

function formatSignedCurrency(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';

  return `${sign}${currency(Math.abs(value))}`;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';

  return `${sign}${Math.abs(value).toFixed(1)}%`;
}
