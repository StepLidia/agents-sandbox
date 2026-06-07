import { Banknote, Landmark, Percent, PiggyBank } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  buildMortgageChartTicks,
  calculateMortgageRepaymentProjection,
  clampPercent,
  type MortgageAmortizationStrategy,
  type MortgageRepaymentProjection,
} from '../calculations/mortgageCalculations';
import { tooltipContentClasses } from '../constants/tooltipStyles';
import { currency } from '../finance';

const MIN_INTEREST_RATE = 0.5;
const MAX_INTEREST_RATE = 6;
const INTEREST_RATE_STEP = 0.01;
const DEFAULT_INTEREST_RATE = 1.68;
const DEFAULT_REPAYMENT_YEARS = 20;
const DEFAULT_TARGET_LTV = 65;
const MORTGAGE_BALANCE_COLOR = '#2563eb';
const INTEREST_COST_COLOR = '#42ba85';

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
        <span className="rounded-lg border border-blue-300/30 bg-blue-500/10 px-2 py-1 text-sm font-bold text-blue-600">
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
            className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${strategy === strategyOption
              ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-600/20'
              : 'border-slate-300/40 bg-white/40 text-slate-700 hover:border-blue-300/50 hover:text-blue-600'
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
      className={`glass-panel w-full p-3 text-left transition ${isSelected ? 'ring-2 ring-blue-500/70' : 'hover:ring-2 hover:ring-blue-300/40'
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
      <RepaymentLineChart projection={projection} />
      <RepaymentSummaryStrip loanToValue={loanToValue} projection={projection} />
    </button>
  );
}

function RepaymentLineChart({
  projection,
}: {
  projection: MortgageRepaymentProjection;
}) {
  const chartData = projection.schedule.map((year) => ({
    annualInterestCost: Math.round(year.annualInterestCost),
    mortgageBalance: Math.round(year.mortgageBalance),
    name: year.year === 0 ? 'Now' : `Year ${year.year}`,
    year: year.year,
  }));
  const balanceTicks = buildMortgageChartTicks(chartData.map((year) => year.mortgageBalance));
  const interestTicks = buildMortgageChartTicks(chartData.map((year) => year.annualInterestCost));
  const xAxisTicks = ['Now', 'Year 5', 'Year 10', 'Year 15', 'Year 20'];

  return (
    <div className="mt-3">
      <ChartLegend
        items={[
          { label: 'Mortgage Balance', color: MORTGAGE_BALANCE_COLOR },
          { label: 'Annual Interest Cost', color: INTEREST_COST_COLOR },
        ]}
      />
      <div className="grid grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-1">
        <ChartAxisLabel color={MORTGAGE_BALANCE_COLOR} text="Mortgage Balance (CHF)" />
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ bottom: 4, left: 4, right: 4, top: 8 }}>
            <CartesianGrid horizontal stroke="#cbd5e1" strokeDasharray="3 3" strokeOpacity={0.6} vertical />
            <XAxis
              axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.65 }}
              dataKey="name"
              interval={0}
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
              tickLine={false}
              ticks={xAxisTicks}
            />
            <YAxis
              axisLine={{ stroke: MORTGAGE_BALANCE_COLOR, strokeOpacity: 0.8 }}
              tick={{ fill: MORTGAGE_BALANCE_COLOR, fontSize: 12, fontWeight: 700 }}
              tickFormatter={formatThousandsAxis}
              tickLine={false}
              ticks={balanceTicks}
              width={58}
              yAxisId="balance"
            />
            <YAxis
              axisLine={{ stroke: INTEREST_COST_COLOR, strokeOpacity: 0.8 }}
              orientation="right"
              tick={{ fill: INTEREST_COST_COLOR, fontSize: 12, fontWeight: 700 }}
              tickFormatter={formatThousandsAxis}
              tickLine={false}
              ticks={interestTicks}
              width={44}
              yAxisId="interest"
            />
            <Tooltip content={<RepaymentTooltip />} cursor={{ stroke: 'rgba(37,99,235,.18)', strokeWidth: 2 }} />
            <Line
              dataKey="mortgageBalance"
              dot={{ fill: MORTGAGE_BALANCE_COLOR, r: 3, stroke: MORTGAGE_BALANCE_COLOR, strokeWidth: 1 }}
              name="Mortgage Balance"
              stroke={MORTGAGE_BALANCE_COLOR}
              strokeWidth={3}
              type="monotone"
              yAxisId="balance"
            />
            <Line
              dataKey="annualInterestCost"
              dot={{ fill: INTEREST_COST_COLOR, r: 3, stroke: INTEREST_COST_COLOR, strokeWidth: 1 }}
              name="Annual Interest Cost"
              stroke={INTEREST_COST_COLOR}
              strokeWidth={3}
              type="monotone"
              yAxisId="interest"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <ChartAxisLabel color={INTEREST_COST_COLOR} text="Cost per Year (CHF)" />
      </div>
    </div>
  );
}

function RepaymentSummaryStrip({
  loanToValue,
  projection,
}: {
  loanToValue: number;
  projection: MortgageRepaymentProjection;
}) {
  const strategySummary =
    projection.strategy === 'indirect'
      ? `3a assets ${currency(projection.endingPillar3Assets)} CHF`
      : `Debt repaid ${currency(projection.totalAmortization)} CHF`;

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-200/50 bg-slate-200/35 px-3 py-3 text-xs font-bold text-slate-700 shadow-inner shadow-white/40 backdrop-blur-md md:flex-row md:items-center md:justify-between">
      <p>
        After {DEFAULT_REPAYMENT_YEARS} years:{' '}
        <span className="text-blue-600">Balance {currency(projection.endingMortgageBalance)} CHF</span>{' '}
        <span className="text-slate-500">({loanToValue.toFixed(0)}% LTV)</span>
      </p>
      <p>
        Total Interest Paid: <span className="text-emerald-700">{currency(projection.totalInterestPaid)} CHF</span>
      </p>
      <p className="text-slate-600">{strategySummary}</p>
    </div>
  );
}

function ChartLegend({ items }: { items: Array<{ color: string; label: string }> }) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-bold text-slate-700">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2">
          <span className="relative h-2.5 w-6">
            <span className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2" style={{ backgroundColor: item.color }} />
            <span
              className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ChartAxisLabel({
  color,
  text,
}: {
  color: string;
  text: string;
}) {
  return (
    <span
      className="pointer-events-none flex h-65 w-4 items-center justify-center overflow-visible text-sm font-bold leading-none whitespace-nowrap"
      style={{ color }}
    >
      <span className="-rotate-90">{text}</span>
    </span>
  );
}

function RepaymentTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ color?: string; dataKey?: string | number; name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={tooltipContentClasses('px-3 py-2')}>
      {label && <p className="mb-2 font-bold text-slate-950">{label}</p>}
      {payload.map((item) => (
        <p key={`${item.name}-${item.dataKey}`} className="text-sm font-semibold text-slate-700">
          <span style={{ color: item.color }}>{item.name}:</span> {currency(item.value ?? 0)} CHF
        </p>
      ))}
    </div>
  );
}

function formatThousandsAxis(value: number) {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
}
