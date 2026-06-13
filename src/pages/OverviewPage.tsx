import { Link } from 'react-router-dom';
import {
  buildProgressChartData,
  calculateCurrentWealth,
  calculateProgressTargetPercent,
  calculateTotalBalance,
} from '../calculations/progressCalculations';
import { type calculateDashboard, type FinancialAsset } from '../finance';

type OverviewPageProps = {
  dashboard: ReturnType<typeof calculateDashboard>;
  projectionYears: number;
};

type ProgressBaseline = {
  balances: Record<string, number>;
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

type SavedProgressMonthlyRecords = Record<string, ProgressMonthlyRecord>;

const PROGRESS_BASELINE_STORAGE_KEY = 'growly-progress-baseline-v1';
const PROGRESS_MONTHLY_RECORD_STORAGE_KEY = 'growly-progress-monthly-record-v1';

const overviewCardStyles = [
  {
    id: 'projected',
    label: 'Total projected wealth',
    tone: 'from-blue-600/12 via-white/52 to-cyan-500/12',
  },
  {
    id: 'current',
    label: 'Current wealth',
    tone: 'from-emerald-600/12 via-white/52 to-teal-500/12',
  },
  {
    id: 'monthly',
    label: 'Monthly future building',
    tone: 'from-violet-600/12 via-white/52 to-fuchsia-500/12',
  },
  {
    id: 'horizon',
    label: 'Planning horizon',
    tone: 'from-amber-500/14 via-white/52 to-rose-500/12',
  },
] as const;

export function OverviewPage({ dashboard, projectionYears }: OverviewPageProps) {
  const currentDate = new Date();
  const currentProgressMonth = getProgressMonthFromDate(currentDate);
  const baseline = readSavedProgressBaseline();
  const monthlyRecords = readSavedProgressMonthlyRecords();
  const monthlyRecord = monthlyRecords[currentProgressMonth.key] ?? null;
  const currentAssets = getProgressCurrentAssets(dashboard.assets, monthlyRecord);
  const totalCurrentWealth = calculateCurrentWealth(currentAssets);
  const activeBaselineBalances = baseline?.balances ?? getProgressAssetBalances(currentAssets);
  const progressChartData = buildProgressChartData({
    actualPoints: getProgressActualPoints({
      baseline,
      currentDate,
      currentWealth: totalCurrentWealth,
      monthlyRecords,
    }),
    baselineDate: baseline ? new Date(baseline.recordedAt) : currentDate,
    baselineBalances: activeBaselineBalances,
    optimisticAssets: currentAssets,
    projectionYears,
  });
  const targetWealth = progressChartData.at(-1)?.plannedWealth ?? totalCurrentWealth;
  const currentWealthProgressPercent = calculateProgressTargetPercent(totalCurrentWealth, targetWealth);
  const monthlyFutureBuilding =
    dashboard.income.savingsContribution + dashboard.income.investmentContribution + dashboard.income.pillar3Contribution;
  const cards = [
    formatMoney(targetWealth),
    formatMoney(totalCurrentWealth),
    formatMoney(monthlyFutureBuilding),
    `${projectionYears} years`,
  ];

  return (
    <section className="relative flex min-h-[calc(100dvh-7rem)] overflow-hidden rounded-lg border border-slate-200/60 bg-linear-to-br from-white/75 via-sky-50/70 to-emerald-50/60 px-5 py-6 shadow-sm md:min-h-[calc(100dvh-3rem)] md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-5 pb-28 md:pb-36">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-normal text-slate-950 md:text-5xl">
            Track your financial future
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Get a quick overview of your financial situation and projections. Turn financial habits into measurable progress toward your long-term goals.
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          {overviewCardStyles.map(({ id, label, tone }, index) => (
            <Link
              key={label}
              aria-label={`Open details for ${label}`}
              className={`glass-panel aspect-square overflow-hidden rounded-lg bg-linear-to-br ${tone} p-3 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30`}
              to="/details"
            >
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm font-bold leading-5 text-slate-700">{label}</p>
                {id === 'current' ? (
                  <CurrentWealthProgressRing
                    amount={cards[index]}
                    progressPercent={currentWealthProgressPercent}
                  />
                ) : (
                  <p className="text-xl font-black tracking-normal text-slate-950">{cards[index]}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute -left-4 right-0 bottom-0 z-20 h-72 overflow-visible sm:-left-6 sm:h-80 md:-left-8 md:h-88">
        <FlowerAccent
          className="bottom-6 left-0 h-44 w-36 sm:left-2 sm:h-52 sm:w-44 md:left-4 md:h-56 md:w-48"
          position="left bottom"
          size="21rem auto"
        />
        <FlowerAccent
          className="bottom-6 left-44 h-40 w-36 sm:left-56 sm:h-48 sm:w-44 md:left-68 md:h-52 md:w-48 xl:left-76"
          position="right bottom"
          size="21rem auto"
        />
        <div className="rocking-grandma absolute bottom-8 left-14 w-44 origin-bottom-left sm:left-20 sm:w-60 md:left-24 md:w-72 xl:left-28">
          <img
            className="block w-full scale-x-[-1] object-contain"
            src="/images/rocking-grandma.png"
            alt="Illustration of an elderly woman reading in a rocking chair."
          />
        </div>
      </div>
    </section>
  );
}

function FlowerAccent({
  className,
  position,
  size,
}: {
  className: string;
  position: string;
  size: string;
}) {
  return (
    <div
      className={`absolute bg-no-repeat opacity-95 ${className}`}
      aria-hidden="true"
      style={{
        backgroundImage: 'url("/images/flowers.png")',
        backgroundPosition: position,
        backgroundSize: size,
      }}
    />
  );
}

function CurrentWealthProgressRing({ amount, progressPercent }: { amount: string; progressPercent: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const safeProgressPercent = Math.min(Math.max(progressPercent, 0), 100);
  const strokeDashoffset = circumference - (safeProgressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" role="img" viewBox="0 0 112 112" aria-label={`${Math.round(safeProgressPercent)}% goal`}>
          <circle
            cx="56"
            cy="56"
            fill="none"
            r={radius}
            stroke="rgb(226 232 240)"
            strokeWidth="11"
          />
          <circle
            cx="56"
            cy="56"
            fill="none"
            r={radius}
            stroke="rgb(5 150 105)"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth="11"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-black tracking-normal text-slate-950">{Math.round(safeProgressPercent)}%</p>
            <p className="text-sm font-bold text-emerald-700">goal</p>
          </div>
        </div>
      </div>
      <p className="text-sm font-black tracking-normal text-slate-950">{amount}</p>
    </div>
  );
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))} CHF`;
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

function readSavedProgressMonthlyRecords(): SavedProgressMonthlyRecords {
  try {
    const savedValue = window.localStorage.getItem(PROGRESS_MONTHLY_RECORD_STORAGE_KEY);
    const records = savedValue ? JSON.parse(savedValue) : null;

    if (isProgressMonthlyRecord(records)) {
      return {
        [getProgressMonthFromDate(new Date(records.recordedAt)).key]: records,
      };
    }

    return isSavedProgressMonthlyRecords(records) ? records : {};
  } catch {
    return {};
  }
}

function getProgressCurrentAssets(assets: FinancialAsset[], monthlyRecord: ProgressMonthlyRecord | null) {
  if (!monthlyRecord) {
    return assets;
  }

  return assets.map((asset) => ({
    ...asset,
    amount: getSavedProgressBalance(monthlyRecord.balances[asset.id], asset.amount),
  }));
}

function getProgressAssetBalances(assets: FinancialAsset[]) {
  return Object.fromEntries(assets.map((asset) => [asset.id, Math.max(0, asset.amount)]));
}

function getProgressActualPoints({
  baseline,
  currentDate,
  currentWealth,
  monthlyRecords,
}: {
  baseline: ProgressBaseline | null;
  currentDate: Date;
  currentWealth: number;
  monthlyRecords: SavedProgressMonthlyRecords;
}) {
  const actualPoints = [
    {
      date: baseline ? new Date(baseline.recordedAt) : currentDate,
      totalWealth: baseline?.totalWealth ?? currentWealth,
    },
  ];

  Object.values(monthlyRecords).forEach((monthlyRecord) => {
    actualPoints.push({
      date: new Date(monthlyRecord.recordedAt),
      totalWealth: calculateTotalBalance(monthlyRecord.balances),
    });
  });

  return actualPoints;
}

function getSavedProgressBalance(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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

function formatProgressMonth(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
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
    Number.isFinite(baseline.totalWealth) &&
    isProgressBalanceRecord(baseline.balances)
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

function isSavedProgressMonthlyRecords(value: unknown): value is SavedProgressMonthlyRecords {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every(isProgressMonthlyRecord);
}

function isProgressBalanceRecord(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return Object.values(value).every((balance) => typeof balance === 'number' && Number.isFinite(balance));
}
