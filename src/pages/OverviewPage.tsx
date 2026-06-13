import { Link } from 'react-router-dom';
import { calculateOverviewProgressPercent } from '../calculations/overviewCalculations';
import { type calculateDashboard } from '../finance';

type OverviewPageProps = {
  dashboard: ReturnType<typeof calculateDashboard>;
  projectionYears: number;
};

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
  const totalCurrentWealth = dashboard.assets.reduce((sum, asset) => sum + asset.amount, 0);
  const monthlyFutureBuilding =
    dashboard.income.savingsContribution + dashboard.income.investmentContribution + dashboard.income.pillar3Contribution;
  const currentWealthProgressPercent = calculateOverviewProgressPercent(totalCurrentWealth, dashboard.totalWealth);
  const cards = [
    formatMoney(dashboard.totalWealth),
    formatMoney(totalCurrentWealth),
    formatMoney(monthlyFutureBuilding),
    `${projectionYears} years`,
  ];

  return (
    <section className="relative flex min-h-[calc(100dvh-7rem)] overflow-hidden rounded-lg border border-slate-200/60 bg-linear-to-br from-white/75 via-sky-50/70 to-emerald-50/60 px-5 py-6 shadow-sm md:min-h-[calc(100dvh-3rem)] md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-5 pb-32 md:pb-40">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl font-black tracking-normal text-slate-950 md:text-5xl">
            Track your financial future
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Get a quick overview of your financial situation and projections. Turn financial habits into measurable progress toward your long-term goals.
          </p>
        </div>

        <div className="grid w-full max-w-lg grid-cols-2 gap-3">
          {overviewCardStyles.map(({ id, label, tone }, index) => (
            <Link
              key={label}
              aria-label={`Open details for ${label}`}
              className={`glass-panel aspect-square overflow-hidden rounded-lg bg-linear-to-br ${tone} p-4 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30`}
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
                  <p className="text-2xl font-black tracking-normal text-slate-950">{cards[index]}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rocking-grandma pointer-events-none absolute bottom-0 left-0 w-48 origin-bottom-left sm:w-64 md:w-72 xl:w-80">
        <img
          className="block w-full scale-x-[-1] object-contain"
          src="/images/rocking-grandma.png"
          alt="Illustration of an elderly woman reading in a rocking chair."
        />
      </div>
    </section>
  );
}

function CurrentWealthProgressRing({ amount, progressPercent }: { amount: string; progressPercent: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" role="img" viewBox="0 0 96 96" aria-label={`${Math.round(progressPercent)}% goal`}>
          <circle
            cx="48"
            cy="48"
            fill="none"
            r={radius}
            stroke="rgb(226 232 240)"
            strokeWidth="10"
          />
          <circle
            cx="48"
            cy="48"
            fill="none"
            r={radius}
            stroke="rgb(5 150 105)"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeWidth="10"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-black tracking-normal text-slate-950">{Math.round(progressPercent)}%</p>
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
