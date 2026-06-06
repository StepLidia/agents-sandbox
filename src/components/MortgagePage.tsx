import {
  Banknote,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  CircleDollarSign,
  Home,
  Info,
  Landmark,
  Percent,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import {
  calculateMortgageOverview,
  clampPercent,
  defaultMortgageInputs,
  type MortgageAsset,
} from '../calculations/mortgageCalculations';
import { currency } from '../finance';

const assetIconById: Record<string, LucideIcon> = {
  cash: PiggyBank,
  pillar2: Landmark,
  pillar3: CircleDollarSign,
  securities: TrendingUp,
};

const MAX_PROPERTY_PRICE = 3000000;
const PROPERTY_PRICE_STEP = 10000;

export function MortgagePage() {
  const [propertyPrice, setPropertyPrice] = useState(defaultMortgageInputs.propertyPrice);
  const mortgageInputs = useMemo(
    () => ({
      ...defaultMortgageInputs,
      propertyPrice,
    }),
    [propertyPrice],
  );
  const mortgage = useMemo(() => calculateMortgageOverview(mortgageInputs), [mortgageInputs]);
  const topMetrics = [
    {
      icon: Percent,
      iconClassName: 'bg-emerald-500/10 text-emerald-600',
      label: 'Affordability Ratio',
      value: `${mortgage.affordabilityRatio.toFixed(1)}%`,
      helper:
        mortgage.affordabilityRatio <= mortgageInputs.maxAffordabilityRatio
          ? `Well within the ${mortgageInputs.maxAffordabilityRatio}% limit`
          : `Above the ${mortgageInputs.maxAffordabilityRatio}% limit`,
    },
    {
      icon: ShieldCheck,
      iconClassName: 'bg-blue-600/10 text-blue-600',
      label: 'Stress Test Rate',
      value: `${mortgageInputs.annualInterestRate.toFixed(2)}%`,
      helper: 'Applied by banks',
    },
    {
      icon: ChartNoAxesCombined,
      iconClassName: 'bg-violet-500/10 text-violet-600',
      label: 'Loan-to-Value (LTV)',
      value: `${mortgage.loanToValueRatio.toFixed(0)}%`,
      helper: `Within the ${mortgageInputs.maxLoanToValueRatio}% limit`,
    },
  ];
  const summaryCards = [
    {
      icon: Home,
      iconClassName: 'bg-blue-600/10 text-blue-600',
      label: 'Property Price',
      value: `${currency(propertyPrice)} CHF`,
      helper: '',
    },
    {
      icon: Percent,
      iconClassName: 'bg-emerald-500/10 text-emerald-600',
      label: 'Down Payment (20%)',
      value: `${currency(mortgage.downPayment)} CHF`,
      helper: `${mortgage.downPaymentRatio.toFixed(1)}%`,
      helperClassName: 'text-emerald-600',
    },
    {
      icon: Landmark,
      iconClassName: 'bg-amber-500/12 text-amber-500',
      label: 'Mortgage Amount',
      value: `${currency(mortgage.mortgageAmount)} CHF`,
      helper: `${mortgage.loanToValueRatio.toFixed(1)}%`,
      helperClassName: 'text-amber-500',
    },
    {
      icon: BriefcaseBusiness,
      iconClassName: 'bg-blue-600/10 text-blue-600',
      label: `Monthly Payment (At ${mortgageInputs.annualInterestRate.toFixed(2)}%)`,
      value: `${currency(mortgage.monthlyPayment)} CHF`,
      helper: `${mortgage.affordabilityRatio.toFixed(1)}% of gross income`,
      helperClassName: 'text-slate-600',
    },
  ];

  return (
    <div className="space-y-4">
      <MortgageHeader />
      <section className="glass-panel p-5">
        <div>
          <h2 className="text-base font-bold tracking-normal text-slate-950 md:text-lg">1. Can You Afford This Property?</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">Based on your income and available assets</p>
        </div>
        <div className="mt-5 grid items-stretch gap-4 md:grid-cols-2">
          <AffordabilityPanel
            metrics={topMetrics}
            mortgage={mortgage}
            propertyPrice={propertyPrice}
            onPropertyPriceChange={setPropertyPrice}
          />
          <div className="flex h-full flex-col gap-4">
            <AssetsPanel assets={mortgageInputs.availableAssets} total={mortgage.totalAvailableAssets} />
            <DownPaymentPanel
              downPayment={mortgage.downPayment}
              downPaymentRatio={mortgage.downPaymentRatio}
              requiredDownPayment={mortgage.requiredDownPayment}
            />
          </div>
        </div>
      </section>
      <section className="glass-panel grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <MortgageSummaryCard key={card.label} {...card} />
        ))}
      </section>
    </div>
  );
}

function MortgageHeader() {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Mortgage</h1>
      <p className="mt-2 text-sm text-slate-700">Plan your home financing in Switzerland. All calculations in CHF.</p>
    </header>
  );
}

function AffordabilityPanel({
  metrics,
  mortgage,
  onPropertyPriceChange,
  propertyPrice,
}: {
  metrics: Array<{
    helper: string;
    icon: LucideIcon;
    iconClassName: string;
    label: string;
    value: string;
  }>;
  mortgage: ReturnType<typeof calculateMortgageOverview>;
  propertyPrice: number;
  onPropertyPriceChange: (value: number) => void;
}) {
  return (
    <section className="glass-panel flex h-full flex-col p-5">
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-start md:text-left">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-4 border-emerald-500/70 text-emerald-600">
          <Check className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-emerald-600 md:text-xl">
            {mortgage.canAffordProperty ? 'Yes, you can afford this property!' : 'This property needs more review.'}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Based on your financial situation, you can afford a property up to:</p>
        </div>
      </div>
      <p className="mt-6 text-center text-3xl font-bold tracking-normal text-emerald-600 md:text-4xl">
        {currency(mortgage.maxAffordablePropertyPrice)} <span className="text-xl md:text-2xl">CHF</span>
      </p>
      <MortgageProgress mortgage={mortgage} propertyPrice={propertyPrice} onPropertyPriceChange={onPropertyPriceChange} />
      <div className="mt-auto grid gap-3 pt-6 md:grid-cols-3">
        {metrics.map((metric) => (
          <MortgageMetricTile key={metric.label} {...metric} />
        ))}
      </div>
    </section>
  );
}

function MortgageProgress({
  mortgage,
  onPropertyPriceChange,
  propertyPrice,
}: {
  mortgage: ReturnType<typeof calculateMortgageOverview>;
  propertyPrice: number;
  onPropertyPriceChange: (value: number) => void;
}) {
  const progressPercent = clampPercent((propertyPrice / MAX_PROPERTY_PRICE) * 100);
  const affordablePercent = clampPercent((mortgage.maxAffordablePropertyPrice / MAX_PROPERTY_PRICE) * 100);

  return (
    <div className="mt-6">
      <div className="relative pt-12">
        <div
          className="absolute top-0 w-48 -translate-x-1/2 text-center text-sm font-bold text-slate-950"
          style={{ left: `${progressPercent}%` }}
        >
          <span className="block">Requested Property Price</span>
          <span className="block">{currency(propertyPrice)} CHF</span>
        </div>
        <span
          className="pointer-events-none absolute top-12 z-10 h-5 w-1 -translate-x-1/2 -translate-y-1.5 rounded-full bg-emerald-800/70 shadow-sm"
          title="Maximum affordable property price"
          style={{ left: `${affordablePercent}%` }}
        />
        <input
          aria-label="Requested property price"
          className="years-slider mortgage-slider"
          max={MAX_PROPERTY_PRICE}
          min={0}
          step={PROPERTY_PRICE_STEP}
          style={{ '--slider-progress': `${progressPercent}%` } as CSSProperties}
          type="range"
          value={propertyPrice}
          onChange={(event) => onPropertyPriceChange(Number(event.currentTarget.value))}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-sm font-bold text-slate-600">
        <span>0 CHF</span>
        <span>{currency(MAX_PROPERTY_PRICE)} CHF</span>
      </div>
      <div className="relative mt-1 h-5 text-sm font-bold text-emerald-700">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${affordablePercent}%` }}>
          Max affordable: {currency(mortgage.maxAffordablePropertyPrice)} CHF
        </span>
      </div>
    </div>
  );
}

function MortgageMetricTile({
  helper,
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  helper: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <article className="glass-panel flex h-full min-h-30 flex-col p-4">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h3 className="min-h-9 text-sm font-bold leading-4 text-slate-950">{label}</h3>
        </div>
      </div>
      <p className="mt-2 text-center whitespace-nowrap text-xl font-bold tracking-normal text-slate-950 2xl:text-2xl">{value}</p>
      <div className="mt-auto pt-3 text-sm">
        <span className="text-slate-600">{helper}</span>
      </div>
    </article>
  );
}

function AssetsPanel({ assets, total }: { assets: MortgageAsset[]; total: number }) {
  return (
    <section className="glass-panel flex flex-1 flex-col p-5">
      <h2 className="text-base font-bold text-slate-950">Available Assets</h2>
      <div className="mt-5 space-y-4">
        {assets.map((asset) => (
          <AssetRow key={asset.id} asset={asset} />
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-300/50 pt-5">
        <p className="text-base font-bold text-emerald-600">Total Available Assets</p>
        <p className="whitespace-nowrap text-lg font-bold tracking-normal text-emerald-600">{currency(total)} CHF</p>
      </div>
    </section>
  );
}

function AssetRow({ asset }: { asset: MortgageAsset }) {
  const Icon = assetIconById[asset.id] ?? Banknote;

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="h-5 w-5 shrink-0 text-emerald-600" />
        <span className="truncate font-bold text-slate-600">{asset.label}</span>
      </span>
      <span className="whitespace-nowrap font-bold text-slate-950">{currency(asset.amount)} CHF</span>
    </div>
  );
}

function DownPaymentPanel({
  downPayment,
  downPaymentRatio,
  requiredDownPayment,
}: {
  downPayment: number;
  downPaymentRatio: number;
  requiredDownPayment: number;
}) {
  return (
    <section className="glass-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-base font-bold text-emerald-600">Down Payment You Can Make</h2>
        <Info className="h-5 w-5 shrink-0 text-emerald-600" />
      </div>
      <p className="mt-4 text-2xl font-bold tracking-normal text-emerald-600">
        {currency(downPayment)} CHF <span className="text-lg">({downPaymentRatio.toFixed(0)}%)</span>
      </p>
      <p className="mt-3 text-sm font-bold text-slate-600">
        Min. required: {currency(requiredDownPayment)} CHF ({defaultMortgageInputs.requiredDownPaymentRatio}%)
      </p>
    </section>
  );
}

function MortgageSummaryCard({
  helper,
  helperClassName = 'text-slate-500',
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  helper: string;
  helperClassName?: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <article className="flex min-h-28 items-center gap-4 border-slate-300/50 md:border-r md:last:border-r-0">
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconClassName}`}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-600">{label}</p>
        <p className="mt-2 text-xl font-bold tracking-normal text-slate-950">{value}</p>
        {helper && <p className={`mt-2 text-sm font-bold ${helperClassName}`}>{helper}</p>}
      </div>
    </article>
  );
}
