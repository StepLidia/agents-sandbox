import {
  Banknote,
  BookOpenText,
  BriefcaseBusiness,
  ChartPie,
  Check,
  CircleAlert,
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
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  calculateGrossAnnualIncome,
  calculateHardEquityRatio,
  calculateMortgageOverview,
  clampPercent,
  defaultMortgageInputs,
  MIN_HARD_EQUITY_RATIO,
  type MortgageAsset,
  type MortgageCostAmounts,
  type MortgageCostItemId,
} from '../calculations/mortgageCalculations';
import { buttonClasses } from '../constants/buttonStyles';
import { colorClasses, type ChartPalette } from '../constants/colors';
import { tooltipClasses } from '../constants/tooltipStyles';
import { currency, type FinancialAsset } from '../finance';
import { useEditableNumber } from '../hooks/useEditableNumber';
import { CostsVsRentingCard } from './CostsVsRentingCard';
import { MortgageCostsCard } from './MortgageCostsCard';
import { DEFAULT_REPAYMENT_INTEREST_RATE, MortgageRepaymentCard } from './MortgageRepaymentCard';

const assetIconById: Record<string, LucideIcon> = {
  cash: PiggyBank,
  pillar2: Landmark,
  pillar3: CircleDollarSign,
  securities: TrendingUp,
};

const assetColorById: Record<string, ChartPalette> = {
  cash: colorClasses.blue,
  pillar2: colorClasses.emerald,
  pillar3: colorClasses.cyan,
  securities: colorClasses.coral,
};

const MAX_PROPERTY_PRICE = 3000000;
const PROPERTY_PRICE_STEP = 1000;
const MORTGAGE_STORAGE_KEY = 'growly-mortgage-inputs-v1';
const mortgageMoneyInputClasses = 'glass-input w-40 shrink-0 justify-between gap-2 px-2 py-1';
const MORTGAGE_STRUCTURE_POPOVER_MAX_WIDTH = 768;
const MORTGAGE_STRUCTURE_POPOVER_MIN_WIDTH = 320;
const MORTGAGE_STRUCTURE_POPOVER_EDGE_GAP = 16;
const MORTGAGE_STRUCTURE_POPOVER_BUTTON_GAP = 16;
const DEFAULT_RENT_PER_MONTH = 2000;

function formatMortgagePercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getMortgageStructurePopoverStyle(buttonRect: DOMRect, viewportWidth: number): CSSProperties {
  const availableWidth = buttonRect.left - MORTGAGE_STRUCTURE_POPOVER_EDGE_GAP - MORTGAGE_STRUCTURE_POPOVER_BUTTON_GAP;
  const width = Math.max(
    MORTGAGE_STRUCTURE_POPOVER_MIN_WIDTH,
    Math.min(MORTGAGE_STRUCTURE_POPOVER_MAX_WIDTH, availableWidth),
  );

  return {
    left: Math.max(MORTGAGE_STRUCTURE_POPOVER_EDGE_GAP, buttonRect.left - width - MORTGAGE_STRUCTURE_POPOVER_BUTTON_GAP),
    top: Math.max(MORTGAGE_STRUCTURE_POPOVER_EDGE_GAP, buttonRect.top),
    width: Math.min(width, viewportWidth - MORTGAGE_STRUCTURE_POPOVER_EDGE_GAP * 2),
  };
}

type SavedMortgageInputs = {
  assets?: Record<string, number>;
  assetsEdited?: boolean;
  downPayment?: number;
  downPaymentEdited?: boolean;
  grossMonthlyIncome?: number;
  mortgageCostAmounts?: MortgageCostAmounts;
  propertyPrice?: number;
  rentPerMonth?: number;
  repaymentInterestRate?: number;
};

export function MortgagePage({ dashboardAssets }: { dashboardAssets: FinancialAsset[] }) {
  const savedInputs = useMemo(readSavedMortgageInputs, []);
  const [hasEditedMortgageAssets, setHasEditedMortgageAssets] = useState(() => savedInputs.assetsEdited === true);
  const [hasEditedDownPayment, setHasEditedDownPayment] = useState(() => savedInputs.downPaymentEdited === true);
  const [propertyPrice, setPropertyPrice] = useState(() =>
    getSavedMortgageAmount(savedInputs.propertyPrice, defaultMortgageInputs.propertyPrice),
  );
  const [downPayment, setDownPayment] = useState(() =>
    getSavedMortgageAmount(savedInputs.downPayment, defaultMortgageInputs.downPayment),
  );
  const [grossMonthlyIncome, setGrossMonthlyIncome] = useState(() =>
    getSavedMortgageAmount(savedInputs.grossMonthlyIncome, defaultMortgageInputs.grossAnnualIncome / 12),
  );
  const [mortgageCostAmounts, setMortgageCostAmounts] = useState<MortgageCostAmounts>(() =>
    getSavedMortgageCostAmounts(savedInputs.mortgageCostAmounts),
  );
  const [repaymentInterestRate, setRepaymentInterestRate] = useState(() =>
    getSavedMortgageAmount(savedInputs.repaymentInterestRate, DEFAULT_REPAYMENT_INTEREST_RATE),
  );
  const [rentPerMonth, setRentPerMonth] = useState(() =>
    getSavedMortgageAmount(savedInputs.rentPerMonth, DEFAULT_RENT_PER_MONTH),
  );
  const [mortgageAssets, setMortgageAssets] = useState(() =>
    mergeSavedMortgageAssets(savedInputs.assetsEdited ? savedInputs.assets : undefined, dashboardAssets),
  );
  const mortgageInputs = useMemo(
    () => ({
      ...defaultMortgageInputs,
      availableAssets: mortgageAssets,
      downPayment,
      grossAnnualIncome: calculateGrossAnnualIncome(grossMonthlyIncome),
      propertyPrice,
    }),
    [downPayment, grossMonthlyIncome, mortgageAssets, propertyPrice],
  );
  const mortgage = useMemo(() => calculateMortgageOverview(mortgageInputs), [mortgageInputs]);
  const hardEquityRatio = calculateHardEquityRatio(mortgageInputs.availableAssets, propertyPrice);

  useEffect(() => {
    saveMortgageInputs({
      assets: mortgageAssets,
      assetsEdited: hasEditedMortgageAssets,
      downPayment,
      downPaymentEdited: hasEditedDownPayment,
      grossMonthlyIncome,
      mortgageCostAmounts,
      propertyPrice,
      rentPerMonth,
      repaymentInterestRate,
    });
  }, [
    downPayment,
    grossMonthlyIncome,
    hasEditedDownPayment,
    hasEditedMortgageAssets,
    mortgageCostAmounts,
    mortgageAssets,
    propertyPrice,
    rentPerMonth,
    repaymentInterestRate,
  ]);

  useEffect(() => {
    if (!hasEditedMortgageAssets) {
      setMortgageAssets(mergeSavedMortgageAssets(undefined, dashboardAssets));
    }
  }, [dashboardAssets, hasEditedMortgageAssets]);

  useEffect(() => {
    if (downPayment > mortgage.totalAvailableAssets) {
      setDownPayment(mortgage.totalAvailableAssets);
    }
  }, [downPayment, mortgage.totalAvailableAssets]);

  function updateMortgageAsset(id: string, amount: number) {
    setHasEditedMortgageAssets(true);
    setMortgageAssets((currentAssets) =>
      currentAssets.map((asset) => (asset.id === id ? { ...asset, amount } : asset)),
    );
  }

  function updateDownPayment(amount: number) {
    setHasEditedDownPayment(true);
    setDownPayment(amount);
  }

  function updateMortgageCostAmount(id: MortgageCostItemId, amount: number) {
    setMortgageCostAmounts((currentAmounts) => ({
      ...currentAmounts,
      [id]: amount,
    }));
  }

  function resetMortgageCostAmounts() {
    setMortgageCostAmounts({});
  }

  const topMetrics = [
    {
      icon: Percent,
      iconClassName: 'bg-emerald-500/10 text-emerald-600',
      label: 'Affordability Ratio',
      value: formatMortgagePercent(mortgage.affordabilityRatio),
      helper:
        mortgage.affordabilityRatio <= mortgageInputs.maxAffordabilityRatio
          ? `Well within the ${mortgageInputs.maxAffordabilityRatio}% limit`
          : `Above the ${mortgageInputs.maxAffordabilityRatio}% limit`,
      helperClassName:
        mortgage.affordabilityRatio <= mortgageInputs.maxAffordabilityRatio ? 'text-slate-600' : 'text-red-500',
    },
    {
      icon: ShieldCheck,
      iconClassName: 'bg-blue-600/10 text-blue-600',
      label: 'Stress Test Rate',
      value: formatMortgagePercent(mortgageInputs.annualInterestRate),
      helper: 'Applied by banks',
      helperClassName: 'text-slate-600',
    },
    {
      icon: ChartPie,
      iconClassName: 'bg-violet-500/10 text-violet-600',
      label: 'Loan-to-Value (LTV)',
      value: formatMortgagePercent(mortgage.loanToValueRatio),
      helper:
        mortgage.loanToValueRatio <= mortgageInputs.maxLoanToValueRatio
          ? `Within the ${mortgageInputs.maxLoanToValueRatio}% limit`
          : `Above the ${mortgageInputs.maxLoanToValueRatio}% limit`,
      helperClassName:
        mortgage.loanToValueRatio <= mortgageInputs.maxLoanToValueRatio ? 'text-slate-600' : 'text-red-500',
    },
    {
      icon: PiggyBank,
      iconClassName: 'bg-cyan-500/10 text-cyan-600',
      label: 'Hard Equity',
      value: formatMortgagePercent(hardEquityRatio),
      helper:
        hardEquityRatio >= MIN_HARD_EQUITY_RATIO
          ? `Above ${MIN_HARD_EQUITY_RATIO}% limit`
          : `Below the ${MIN_HARD_EQUITY_RATIO}% limit`,
      helperClassName: hardEquityRatio >= MIN_HARD_EQUITY_RATIO ? 'text-slate-600' : 'text-red-500',
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
      label: `Down Payment (${formatMortgagePercent(mortgage.downPaymentRatio)})`,
      value: `${currency(mortgage.downPayment)} CHF`,
      helper: formatMortgagePercent(mortgage.downPaymentRatio),
      helperClassName: 'text-emerald-600',
    },
    {
      icon: Landmark,
      iconClassName: 'bg-amber-500/12 text-amber-500',
      label: 'Mortgage Amount',
      value: `${currency(mortgage.mortgageAmount)} CHF`,
      helper: formatMortgagePercent(mortgage.loanToValueRatio),
      helperClassName: 'text-amber-500',
    },
    {
      icon: BriefcaseBusiness,
      iconClassName: 'bg-blue-600/10 text-blue-600',
      label: `Monthly Payment (At ${mortgageInputs.annualInterestRate.toFixed(2)}%)`,
      tooltip: 'Interest + Amortization + Maintenance',
      value: `${currency(mortgage.monthlyPayment)} CHF`,
      helper: `${formatMortgagePercent(mortgage.affordabilityRatio)} of gross income`,
      helperClassName: 'text-slate-600',
    },
  ];

  return (
    <div className="space-y-4">
      <MortgageHeader />
      <section className="glass-panel p-4">
        <div>
          <h2 className="text-base font-bold tracking-normal text-slate-950 md:text-lg">1. Can You Afford This Property?</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">Based on your income and available assets</p>
        </div>
        <div className="mt-4 grid items-stretch gap-3 md:grid-cols-5">
          <AffordabilityPanel
            className="md:col-span-3"
            metrics={topMetrics}
            mortgage={mortgage}
            propertyPrice={propertyPrice}
            onPropertyPriceChange={setPropertyPrice}
          />
          <div className="flex h-full flex-col gap-3 md:col-span-2">
            <GrossIncomePanel grossMonthlyIncome={grossMonthlyIncome} onChange={setGrossMonthlyIncome} />
            <AssetsPanel assets={mortgageInputs.availableAssets} total={mortgage.totalAvailableAssets} onChange={updateMortgageAsset} />
            <DownPaymentPanel
              downPayment={mortgage.downPayment}
              downPaymentRatio={mortgage.downPaymentRatio}
              requiredDownPayment={mortgage.requiredDownPayment}
              totalAvailableAssets={mortgage.totalAvailableAssets}
              onChange={updateDownPayment}
            />
          </div>
        </div>
      </section>
      <section className="glass-panel grid items-start gap-3 p-3 md:grid-cols-2 md:p-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <MortgageSummaryCard key={card.label} {...card} />
        ))}
      </section>
      <MortgageRepaymentCard
        interestRate={repaymentInterestRate}
        mortgageAmount={mortgage.mortgageAmount}
        propertyPrice={propertyPrice}
        onInterestRateChange={setRepaymentInterestRate}
      />
      <MortgageCostsCard
        costAmounts={mortgageCostAmounts}
        maintenanceRate={mortgageInputs.maintenanceRate}
        propertyPrice={propertyPrice}
        onCostAmountChange={updateMortgageCostAmount}
        onResetCosts={resetMortgageCostAmounts}
      />
      <CostsVsRentingCard
        costAmounts={mortgageCostAmounts}
        interestRate={repaymentInterestRate}
        maintenanceRate={mortgageInputs.maintenanceRate}
        mortgageAmount={mortgage.mortgageAmount}
        propertyPrice={propertyPrice}
        rentPerMonth={rentPerMonth}
        onRentPerMonthChange={setRentPerMonth}
      />
    </div>
  );
}

function MortgageHeader() {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Mortgage</h1>
      <p className="mt-2 text-sm text-slate-700">Plan your home financing in Switzerland</p>
    </header>
  );
}

function AffordabilityPanel({
  className = '',
  metrics,
  mortgage,
  onPropertyPriceChange,
  propertyPrice,
}: {
  className?: string;
  metrics: Array<{
    helper: string;
    helperClassName: string;
    icon: LucideIcon;
    iconClassName: string;
    label: string;
    value: string;
  }>;
  mortgage: ReturnType<typeof calculateMortgageOverview>;
  propertyPrice: number;
  onPropertyPriceChange: (value: number) => void;
}) {
  const [isStructureOpen, setIsStructureOpen] = useState(false);
  const [structurePopoverStyle, setStructurePopoverStyle] = useState<CSSProperties>();
  const structureButtonRef = useRef<HTMLButtonElement>(null);
  const statusTextClassName = mortgage.canAffordProperty ? 'text-emerald-600' : 'text-red-500';
  const statusIconClassName = mortgage.canAffordProperty ? 'border-emerald-500/70 text-emerald-600' : 'text-red-500';
  const StatusIcon = mortgage.canAffordProperty ? Check : CircleAlert;

  useEffect(() => {
    if (!isStructureOpen) {
      return;
    }

    function updateStructurePopoverStyle() {
      const buttonRect = structureButtonRef.current?.getBoundingClientRect();

      if (buttonRect) {
        setStructurePopoverStyle(getMortgageStructurePopoverStyle(buttonRect, window.innerWidth));
      }
    }

    updateStructurePopoverStyle();
    window.addEventListener('resize', updateStructurePopoverStyle);
    window.addEventListener('scroll', updateStructurePopoverStyle, true);

    return () => {
      window.removeEventListener('resize', updateStructurePopoverStyle);
      window.removeEventListener('scroll', updateStructurePopoverStyle, true);
    };
  }, [isStructureOpen]);

  return (
    <>
      <section className={`glass-panel flex h-full flex-col p-4 ${className}`}>
        <div className="flex flex-col gap-4 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="flex flex-col items-center gap-4 md:min-w-0 md:flex-row">
            <div
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${mortgage.canAffordProperty ? 'border-4' : ''} ${statusIconClassName}`}
            >
              <StatusIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className={`text-lg font-semibold md:text-xl ${statusTextClassName}`}>
                {mortgage.canAffordProperty ? 'Yes, you can afford this property!' : 'This property needs more review.'}
              </p>
            </div>
          </div>
          <div className="relative shrink-0 self-center md:self-start">
            <button
              ref={structureButtonRef}
              aria-controls="mortgage-structure-popover"
              aria-expanded={isStructureOpen}
              aria-label="Show mortgage structure"
              className={buttonClasses({ size: 'icon' })}
              type="button"
              onClick={() => setIsStructureOpen((isOpen) => !isOpen)}
            >
              <BookOpenText className="h-4 w-4" />
            </button>
            {isStructureOpen && structurePopoverStyle && <MortgageStructurePopover style={structurePopoverStyle} />}
          </div>
        </div>
        <p className={`my-4 text-center text-3xl font-bold tracking-normal md:text-4xl ${statusTextClassName}`}>
          {currency(propertyPrice)} <span className="text-xl md:text-2xl">CHF</span>
        </p>
        <MortgageProgress mortgage={mortgage} propertyPrice={propertyPrice} onPropertyPriceChange={onPropertyPriceChange} />
        <div className="mt-auto grid gap-3 pt-4 pb-2 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MortgageMetricTile key={metric.label} {...metric} />
          ))}
        </div>
      </section>
    </>
  );
}

function MortgageStructurePopover({ style }: { style: CSSProperties }) {
  return createPortal(
    <div
      id="mortgage-structure-popover"
      role="dialog"
      aria-label="Mortgage structure"
      className="fixed z-999 rounded-lg border border-slate-300/30 bg-white/95 p-3 shadow-xl shadow-slate-400/20 backdrop-blur-xl"
      style={style}
    >
      <img
        alt="Mortgage structure"
        className="max-h-[min(78vh,48rem)] w-full rounded-md object-contain"
        src="/images/MortgageStructure.webp"
      />
    </div>,
    document.body,
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
  const sliderClassName =
    !mortgage.canAffordProperty
      ? 'years-slider mortgage-slider-over-limit'
      : 'years-slider mortgage-slider';

  return (
    <div className="mt-4">
      <div className="relative pt-2">
        <span
          className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/8 -translate-y-3/4 drop-shadow-sm"
          title="Maximum affordable property price"
          style={{ left: `${affordablePercent}%` }}
        >
          <CheckeredFlagIcon className="h-9 w-9" />
        </span>
        <input
          aria-label="Requested property price"
          className={sliderClassName}
          max={MAX_PROPERTY_PRICE}
          min={0}
          step={PROPERTY_PRICE_STEP}
          style={{ '--slider-progress': `${progressPercent}%` } as CSSProperties}
          type="range"
          value={propertyPrice}
          onChange={(event) => onPropertyPriceChange(Number(event.currentTarget.value))}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm font-bold text-slate-600">
        <span>0 CHF</span>
        <span>{currency(MAX_PROPERTY_PRICE)} CHF</span>
      </div>
      <div className="mt-1 text-center text-sm font-bold text-emerald-700">
        <span>Max affordable: {currency(mortgage.maxAffordablePropertyPrice)} CHF</span>
      </div>
    </div>
  );
}

function CheckeredFlagIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 36 36">
      <path d="M10 5v26" stroke="#0f172a" strokeLinecap="round" strokeWidth="2.6" />
      <path d="M11 6h17v15H11z" fill="white" stroke="#0f172a" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M11 6h5.7v5H11zm11.4 0H28v5h-5.6zm-5.7 5h5.7v5h-5.7zM11 16h5.7v5H11zm11.4 0H28v5h-5.6z" fill="#0f172a" />
    </svg>
  );
}

function MortgageMetricTile({
  helper,
  helperClassName,
  icon: Icon,
  iconClassName,
  label,
  value,
}: {
  helper: string;
  helperClassName: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}) {
  return (
    <article className="glass-panel flex h-full min-h-24 flex-col p-3">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h3 className="min-h-9 text-sm font-bold leading-4 text-slate-950">{label}</h3>
        </div>
      </div>
      <p className="mt-1 text-center whitespace-nowrap text-xl font-bold tracking-normal text-slate-950 2xl:text-2xl">{value}</p>
      <div className="mt-auto pt-2 text-sm">
        <span className={helperClassName}>{helper}</span>
      </div>
    </article>
  );
}

function GrossIncomePanel({
  grossMonthlyIncome,
  onChange,
}: {
  grossMonthlyIncome: number;
  onChange: (amount: number) => void;
}) {
  const { inputValue, onInputChange } = useEditableNumber(grossMonthlyIncome, onChange, { format: 'money' });

  return (
    <section className="glass-panel p-3">
      <h2 className="text-base font-bold text-slate-950">Gross Income per Month</h2>
      <div className="mt-2 flex items-center justify-between gap-4 text-sm">
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-blue-500/20 bg-blue-600/10 text-blue-600">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          <span className="truncate font-bold text-slate-600">Income</span>
        </span>
        <span className={mortgageMoneyInputClasses}>
          <input
            aria-label="Gross monthly income"
            className="min-w-0 flex-1 bg-transparent text-right font-black text-slate-950 outline-none"
            inputMode="numeric"
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.currentTarget.value)}
          />
          <span className="text-sm font-semibold text-slate-600">CHF</span>
        </span>
      </div>
    </section>
  );
}

function AssetsPanel({
  assets,
  onChange,
  total,
}: {
  assets: MortgageAsset[];
  total: number;
  onChange: (id: string, amount: number) => void;
}) {
  return (
    <section className="glass-panel flex flex-1 flex-col p-3">
      <h2 className="text-base font-bold text-slate-950">Available Assets</h2>
      <div className="my-2 flex flex-1 flex-col justify-center gap-1.5">
        {assets.map((asset) => (
          <AssetRow key={asset.id} asset={asset} onChange={onChange} />
        ))}
      </div>
      <div className="mt-1 flex items-center justify-between gap-4 border-t border-slate-300/50 pt-2">
        <p className="text-base font-bold text-emerald-600">Total Available Assets</p>
        <p className="whitespace-nowrap text-lg font-bold tracking-normal text-emerald-600">{currency(total)} CHF</p>
      </div>
    </section>
  );
}

function AssetRow({ asset, onChange }: { asset: MortgageAsset; onChange: (id: string, amount: number) => void }) {
  const Icon = assetIconById[asset.id] ?? Banknote;
  const colors = assetColorById[asset.id] ?? colorClasses.emerald;
  const { inputValue, onInputChange } = useEditableNumber(asset.amount, (amount) => onChange(asset.id, amount), {
    format: 'money',
  });

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="flex min-w-0 items-center gap-3">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${colors.border} ${colors.bg} ${colors.text}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="truncate font-bold text-slate-600">{asset.label}</span>
      </span>
      <span className={mortgageMoneyInputClasses}>
        <input
          aria-label={`${asset.label} mortgage amount`}
          className="min-w-0 flex-1 bg-transparent text-right font-black text-slate-950 outline-none"
          inputMode="numeric"
          type="text"
          value={inputValue}
          onChange={(event) => onInputChange(event.currentTarget.value)}
        />
        <span className="text-sm font-semibold text-slate-600">CHF</span>
      </span>
    </div>
  );
}

function DownPaymentPanel({
  downPayment,
  downPaymentRatio,
  onChange,
  requiredDownPayment,
  totalAvailableAssets,
}: {
  downPayment: number;
  downPaymentRatio: number;
  onChange: (amount: number) => void;
  requiredDownPayment: number;
  totalAvailableAssets: number;
}) {
  const progressPercent = totalAvailableAssets > 0 ? clampPercent((downPayment / totalAvailableAssets) * 100) : 0;

  return (
    <section className="glass-panel p-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-cyan-600">Down Payment ({formatMortgagePercent(downPaymentRatio)})</h2>
        <p className="whitespace-nowrap text-lg font-bold tracking-normal text-cyan-600">{currency(downPayment)} CHF</p>
      </div>
      <input
        aria-label="Down payment amount"
        className="years-slider mt-3"
        max={totalAvailableAssets}
        min={0}
        step={PROPERTY_PRICE_STEP}
        style={{ '--slider-progress': `${progressPercent}%` } as CSSProperties}
        type="range"
        value={downPayment}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <p className="mt-2 text-sm font-semibold text-slate-600">
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
  tooltip,
  value,
}: {
  helper: string;
  helperClassName?: string;
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  tooltip?: string;
  value: string;
}) {
  const tooltipId = tooltip ? `summary-tooltip-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined;

  return (
    <article className="flex items-start gap-3 border-slate-300/50 py-1 md:border-r md:last:border-r-0">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${iconClassName}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
          <span>{label}</span>
          {tooltip && tooltipId && (
            <span className="group relative inline-flex">
              <button
                aria-describedby={tooltipId}
                aria-label={`${label} details`}
                className="grid h-5 w-5 place-items-center rounded-full text-blue-600 outline-none transition hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500/50"
                type="button"
              >
                <Info className="h-4 w-4" />
              </button>
              <span
                id={tooltipId}
                role="tooltip"
                className={tooltipClasses('left-1/2 top-6 w-max -translate-x-1/2 px-3 py-2')}
              >
                {tooltip}
              </span>
            </span>
          )}
        </p>
        <p className="mt-1 text-xl font-bold tracking-normal text-slate-950">{value}</p>
        {helper && <p className={`mt-1 text-sm font-bold ${helperClassName}`}>{helper}</p>}
      </div>
    </article>
  );
}

function readSavedMortgageInputs(): SavedMortgageInputs {
  try {
    const savedValue = window.localStorage.getItem(MORTGAGE_STORAGE_KEY);
    return savedValue ? JSON.parse(savedValue) : {};
  } catch {
    return {};
  }
}

function saveMortgageInputs({
  assets,
  assetsEdited,
  downPayment,
  downPaymentEdited,
  grossMonthlyIncome,
  mortgageCostAmounts,
  propertyPrice,
  rentPerMonth,
  repaymentInterestRate,
}: {
  assets: MortgageAsset[];
  assetsEdited: boolean;
  downPayment: number;
  downPaymentEdited: boolean;
  grossMonthlyIncome: number;
  mortgageCostAmounts: MortgageCostAmounts;
  propertyPrice: number;
  rentPerMonth: number;
  repaymentInterestRate: number;
}) {
  try {
    window.localStorage.setItem(
      MORTGAGE_STORAGE_KEY,
      JSON.stringify({
        assets: Object.fromEntries(assets.map((asset) => [asset.id, asset.amount])),
        assetsEdited,
        downPayment,
        downPaymentEdited,
        grossMonthlyIncome,
        mortgageCostAmounts,
        propertyPrice,
        rentPerMonth,
        repaymentInterestRate,
      } satisfies SavedMortgageInputs),
    );
  } catch {
    // Keep the mortgage calculator usable when browser storage is unavailable.
  }
}

function mergeSavedMortgageAssets(savedAssets: SavedMortgageInputs['assets'], dashboardAssets: FinancialAsset[]) {
  return defaultMortgageInputs.availableAssets.map((asset) => ({
    ...asset,
    amount: getSavedMortgageAmount(savedAssets?.[asset.id], getDashboardMortgageAssetAmount(asset.id, dashboardAssets, asset.amount)),
  }));
}

function getSavedMortgageAmount(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getSavedMortgageCostAmounts(value: unknown): MortgageCostAmounts {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, amount]) => typeof amount === 'number' && Number.isFinite(amount)),
  ) as MortgageCostAmounts;
}

function getDashboardMortgageAssetAmount(mortgageAssetId: string, dashboardAssets: FinancialAsset[], fallback: number) {
  const dashboardAssetIdByMortgageId: Record<string, FinancialAsset['id']> = {
    cash: 'savings',
    pillar2: 'pillar2',
    pillar3: 'pillar3',
    securities: 'investments',
  };
  const dashboardAssetId = dashboardAssetIdByMortgageId[mortgageAssetId];

  return dashboardAssets.find((asset) => asset.id === dashboardAssetId)?.amount ?? fallback;
}
