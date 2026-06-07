import { Banknote, Landmark, Percent, PiggyBank } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  calculateMortgageRepaymentProjection,
  clampPercent,
  type MortgageAmortizationStrategy,
  type MortgageRepaymentProjection,
  type MortgageRepaymentYear,
} from '../calculations/mortgageCalculations';
import { currency } from '../finance';

const MIN_INTEREST_RATE = 0.5;
const MAX_INTEREST_RATE = 6;
const INTEREST_RATE_STEP = 0.01;
const DEFAULT_INTEREST_RATE = 1.68;
const DEFAULT_REPAYMENT_YEARS = 20;
const DEFAULT_TARGET_LTV = 65;

const strategyLabels: Record<MortgageAmortizationStrategy, string> = {
  direct: 'Direct Amortization',
  indirect: 'Indirect Amortization (3a)',
};

export function MortgageRepaymentCard({
  mortgageAmount,
  propertyPrice,
}: {
  mortgageAmount: number;
  propertyPrice: number;
}) {
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const [strategy, setStrategy] = useState<MortgageAmortizationStrategy>('direct');
  const sliderProgress = clampPercent(
    ((interestRate - MIN_INTEREST_RATE) / (MAX_INTEREST_RATE - MIN_INTEREST_RATE)) * 100,
  );
  const projections = useMemo(
    () =>
      (['direct', 'indirect'] as const).map((projectionStrategy) =>
        calculateMortgageRepaymentProjection({
          annualInterestRate: interestRate,
          mortgageAmount,
          propertyPrice,
          strategy: projectionStrategy,
          targetLoanToValueRatio: DEFAULT_TARGET_LTV,
          years: DEFAULT_REPAYMENT_YEARS,
        }),
      ),
    [interestRate, mortgageAmount, propertyPrice],
  );
  const selectedProjection = projections.find((projection) => projection.strategy === strategy) ?? projections[0];

  return (
    <section className="glass-panel p-4">
      <div>
        <h2 className="text-base font-bold tracking-normal text-slate-950 md:text-lg">2. Repaying Your Mortgage</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Compare repayment strategies and adjust the interest rate.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InterestRateControl
          interestRate={interestRate}
          sliderProgress={sliderProgress}
          onInterestRateChange={setInterestRate}
        />
        <StrategyControl strategy={strategy} onStrategyChange={setStrategy} />
        <RepaymentMetricPanel projection={selectedProjection} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {projections.map((projection) => (
          <RepaymentChartCard
            key={projection.strategy}
            isSelected={projection.strategy === strategy}
            projection={projection}
            propertyPrice={propertyPrice}
            onSelect={() => setStrategy(projection.strategy)}
          />
        ))}
      </div>

      <div className="mt-3 grid gap-3 rounded-lg border border-blue-300/30 bg-blue-500/10 p-3 text-sm font-bold text-blue-700 md:grid-cols-3">
        <p>Direct amortization lowers debt and interest costs over time.</p>
        <p>Indirect amortization keeps debt stable while building pledged 3a assets.</p>
        <p>Target after {DEFAULT_REPAYMENT_YEARS} years: {DEFAULT_TARGET_LTV}% loan-to-value.</p>
      </div>
    </section>
  );
}

function InterestRateControl({
  interestRate,
  onInterestRateChange,
  sliderProgress,
}: {
  interestRate: number;
  sliderProgress: number;
  onInterestRateChange: (value: number) => void;
}) {
  return (
    <section className="glass-panel p-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-950">Interest Rate</h3>
          <p className="mt-2 text-2xl font-bold tracking-normal text-blue-600">{interestRate.toFixed(2)}%</p>
        </div>
        <span className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2 py-1 text-sm font-bold text-blue-700">
          Current
        </span>
      </div>
      <input
        aria-label="Mortgage repayment interest rate"
        className="years-slider mt-4"
        max={MAX_INTEREST_RATE}
        min={MIN_INTEREST_RATE}
        step={INTEREST_RATE_STEP}
        style={{ '--slider-progress': `${sliderProgress}%` } as CSSProperties}
        type="range"
        value={interestRate}
        onChange={(event) => onInterestRateChange(Number(event.currentTarget.value))}
      />
      <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-600">
        <span>{MIN_INTEREST_RATE.toFixed(2)}%</span>
        <span>{MAX_INTEREST_RATE.toFixed(2)}%</span>
      </div>
    </section>
  );
}

function StrategyControl({
  onStrategyChange,
  strategy,
}: {
  strategy: MortgageAmortizationStrategy;
  onStrategyChange: (strategy: MortgageAmortizationStrategy) => void;
}) {
  return (
    <section className="glass-panel p-3">
      <h3 className="text-sm font-bold text-slate-950">Amortization Strategy</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(['direct', 'indirect'] as const).map((strategyOption) => (
          <button
            key={strategyOption}
            className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
              strategy === strategyOption
                ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'border-slate-300/40 bg-white/40 text-slate-700 hover:border-blue-300/50 hover:text-blue-700'
            }`}
            type="button"
            onClick={() => onStrategyChange(strategyOption)}
          >
            {strategyLabels[strategyOption].replace(' Amortization', '')}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-600">{strategyLabels[strategy]}</p>
    </section>
  );
}

function RepaymentMetricPanel({ projection }: { projection: MortgageRepaymentProjection }) {
  const metrics = [
    {
      icon: Landmark,
      label: 'After 20 years',
      value: `${currency(projection.endingMortgageBalance)} CHF`,
    },
    {
      icon: Banknote,
      label: 'Monthly repayment',
      value: `${currency(projection.monthlyPayment)} CHF`,
    },
    {
      icon: PiggyBank,
      label: projection.strategy === 'indirect' ? '3a assets' : 'Debt repaid',
      value: `${currency(projection.strategy === 'indirect' ? projection.endingPillar3Assets : projection.totalAmortization)} CHF`,
    },
  ];

  return (
    <section className="glass-panel p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-950">Amortization to</h3>
        <span className="flex items-center gap-1 text-sm font-bold text-emerald-700">
          <Percent className="h-4 w-4" />
          65% LTV
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-bold text-slate-600">
              <metric.icon className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="truncate">{metric.label}</span>
            </span>
            <span className="whitespace-nowrap font-black text-slate-950">{metric.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RepaymentChartCard({
  isSelected,
  onSelect,
  projection,
  propertyPrice,
}: {
  isSelected: boolean;
  projection: MortgageRepaymentProjection;
  propertyPrice: number;
  onSelect: () => void;
}) {
  const loanToValue = propertyPrice > 0 ? (projection.endingMortgageBalance / propertyPrice) * 100 : 0;

  return (
    <button
      className={`glass-panel w-full p-3 text-left transition ${
        isSelected ? 'ring-2 ring-blue-500/70' : 'hover:ring-2 hover:ring-blue-300/40'
      }`}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-950">{strategyLabels[projection.strategy]} - Over Time</h3>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Interest paid: {currency(projection.totalInterestPaid)} CHF
          </p>
        </div>
        <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-sm font-bold text-emerald-700">
          {loanToValue.toFixed(0)}% LTV
        </span>
      </div>
      <RepaymentLineChart projection={projection} propertyPrice={propertyPrice} />
      <div className="mt-3 grid gap-2 rounded-lg bg-white/40 p-2 text-sm font-bold text-slate-700 md:grid-cols-2">
        <p>Balance {currency(projection.endingMortgageBalance)} CHF</p>
        <p>
          {projection.strategy === 'indirect'
            ? `3a assets ${currency(projection.endingPillar3Assets)} CHF`
            : `Debt repaid ${currency(projection.totalAmortization)} CHF`}
        </p>
      </div>
    </button>
  );
}

function RepaymentLineChart({
  projection,
  propertyPrice,
}: {
  projection: MortgageRepaymentProjection;
  propertyPrice: number;
}) {
  const maxAmount = Math.max(propertyPrice, ...projection.schedule.map((year) => year.pillar3Assets));
  const balancePoints = buildChartPoints(projection.schedule, maxAmount, 'mortgageBalance');
  const pillar3Points = buildChartPoints(projection.schedule, maxAmount, 'pillar3Assets');
  const interestPoints = buildChartPoints(projection.schedule, maxAmount, 'annualInterestCost');

  return (
    <svg aria-label={`${strategyLabels[projection.strategy]} projection chart`} className="mt-3 h-48 w-full" role="img" viewBox="0 0 360 180">
      <g stroke="#e2e8f0" strokeWidth="1">
        {[40, 80, 120, 160].map((y) => (
          <line key={y} x1="24" x2="350" y1={y} y2={y} />
        ))}
        {[24, 105, 187, 268, 350].map((x) => (
          <line key={x} x1={x} x2={x} y1="16" y2="154" />
        ))}
      </g>
      <polyline fill="none" points={balancePoints} stroke="#2563eb" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {projection.strategy === 'indirect' && (
        <polyline fill="none" points={pillar3Points} stroke="#047857" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      )}
      <polyline
        fill="none"
        points={interestPoints}
        stroke="#fb7185"
        strokeDasharray="5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <ChartLabel x={24} y={172} text="Now" />
      <ChartLabel x={105} y={172} text="Year 5" />
      <ChartLabel x={187} y={172} text="Year 10" />
      <ChartLabel x={268} y={172} text="Year 15" />
      <ChartLabel x={350} y={172} text="Year 20" />
    </svg>
  );
}

function ChartLabel({ text, x, y }: { text: string; x: number; y: number }) {
  return (
    <text fill="#475569" fontSize="10" fontWeight="700" textAnchor="middle" x={x} y={y}>
      {text}
    </text>
  );
}

function buildChartPoints(
  schedule: MortgageRepaymentYear[],
  maxAmount: number,
  key: keyof Pick<MortgageRepaymentYear, 'annualInterestCost' | 'mortgageBalance' | 'pillar3Assets'>,
) {
  const maxYear = Math.max(schedule.at(-1)?.year ?? 0, 1);
  const chartWidth = 326;
  const chartHeight = 138;

  return schedule
    .map((year) => {
      const x = 24 + (year.year / maxYear) * chartWidth;
      const y = 154 - (maxAmount > 0 ? year[key] / maxAmount : 0) * chartHeight;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}
