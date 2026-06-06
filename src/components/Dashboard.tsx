import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Menu } from 'lucide-react';
import { getPercent } from '../calculations/percent';
import { assets as initialAssets, calculateDashboard, incomePlan, type AssetKind, type FinancialAsset, type IncomePlan } from '../finance';
import { generateFinancialReportPdf } from '../pdf/pdfReport';
import { buttonClasses } from '../constants/buttonStyles';
import { colorClasses } from '../constants/colors';
import { ContactContent } from './ContactCard';
import { ExpensesPage } from './ExpensesPage';
import { Header } from './Header';
import { IncomeCard } from './IncomeCard';
import { InsightsCard } from './InsightsCard';
import { ProjectionCard } from './ProjectionCard';
import { MobileSidebarDrawer, Sidebar, type DashboardView } from './Sidebar';
import { MortgagePage } from './MortgagePage';
import { SummaryCard } from './SummaryCard';
import { AssetCard } from './AssetCard';
import { tooltipClasses } from '../constants/tooltipStyles';

const DASHBOARD_STORAGE_KEY = 'growly-dashboard-inputs-v1';

type SavedDashboardInputs = {
  assets?: Partial<Record<AssetKind, Partial<Pick<FinancialAsset, 'amount' | 'monthlyContribution' | 'annualReturn'>>>>;
  income?: Partial<Pick<IncomePlan, 'monthlyNetIncome'>>;
  projectionYears?: number;
};

export function Dashboard() {
  const savedInputs = useMemo(readSavedDashboardInputs, []);
  const [assets, setAssets] = useState<FinancialAsset[]>(() => mergeSavedAssets(savedInputs.assets));
  const [income, setIncome] = useState<IncomePlan>(() => mergeSavedIncome(savedInputs.income));
  const [projectionYears, setProjectionYears] = useState(() => getSavedNumber(savedInputs.projectionYears, 30));
  const [isExporting, setIsExporting] = useState(false);
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const dashboard = useMemo(() => calculateDashboard(assets, income, projectionYears), [assets, income, projectionYears]);

  useEffect(() => {
    saveDashboardInputs({ assets, income, projectionYears });
  }, [assets, income, projectionYears]);

  function updateAsset(
    id: AssetKind,
    field: keyof Pick<FinancialAsset, 'amount' | 'monthlyContribution' | 'annualReturn'>,
    value: number,
  ) {
    setAssets((currentAssets) =>
      currentAssets.map((asset) => (asset.id === id ? { ...asset, [field]: value } : asset)),
    );
  }

  function updateIncome(field: keyof Pick<IncomePlan, 'monthlyNetIncome'>, value: number) {
    setIncome((currentIncome) => ({ ...currentIncome, [field]: value }));
  }

  function handleExportPdf() {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      generateFinancialReportPdf({
        assets: dashboard.assets,
        income: dashboard.income,
        insightAmounts: dashboard.insightAmounts,
        projectionYears,
        totalCurrentWealth: assets.reduce((sum, asset) => sum + asset.amount, 0),
        totalWealth: dashboard.totalWealth,
        pensionWealth: dashboard.pensionWealth,
        liquidWealth: dashboard.liquidWealth,
        totalProjection: dashboard.totalProjection,
        pensionProjection: dashboard.pensionProjection,
        savingsInvestmentProjection: dashboard.savingsInvestmentProjection,
        zeroReturnTotalProjection: dashboard.zeroReturnTotalProjection,
        zeroReturnPensionProjection: dashboard.zeroReturnPensionProjection,
        zeroReturnSavingsInvestmentProjection: dashboard.zeroReturnSavingsInvestmentProjection,
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#e8eef8] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,235,.24),transparent_31%),radial-gradient(circle_at_72%_7%,rgba(56,189,248,.20),transparent_29%),radial-gradient(circle_at_82%_86%,rgba(96,165,250,.18),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#dce7f6_47%,#f2f5fa_100%)]" />
      <button
        aria-label="Open navigation"
        className={buttonClasses({ className: 'fixed left-4 top-4 z-30 md:hidden', size: 'icon' })}
        type="button"
        onClick={() => setIsMobileNavOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>
      <MobileSidebarDrawer
        activeView={activeView}
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onViewChange={setActiveView}
      />
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_1fr]">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <section className="flex min-h-screen flex-col px-4 pb-4 pt-20 sm:px-5 md:py-4 xl:px-6">
          {activeView === 'overview' ? (
            <>
              <Header isExporting={isExporting} onExportPdf={handleExportPdf} />
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {dashboard.assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onChange={updateAsset} />
                ))}
              </div>
              <div className="mt-3 grid items-stretch gap-3 xl:grid-cols-4">
                <div className="h-full xl:col-span-2">
                  <IncomeCard
                    income={dashboard.income}
                    futureBuildingPercent={dashboard.futureBuildingPercent}
                    onChange={updateIncome}
                  />
                </div>
                <div className="h-full">
                  <SummaryCard
                    totalWealth={dashboard.totalWealth}
                    pensionWealth={dashboard.pensionWealth}
                    liquidWealth={dashboard.liquidWealth}
                    projectionYears={projectionYears}
                  />
                </div>
                <div className="h-full">
                  <InsightsCard insightAmounts={dashboard.insightAmounts} projectionYears={projectionYears} />
                </div>
              </div>
              <YearsSlider value={projectionYears} onChange={setProjectionYears} />
              <div className="mt-3 grid gap-3 xl:grid-cols-3">
                <ProjectionCard
                  title="Total Wealth Over Time"
                  amount={dashboard.totalWealth}
                  subtitle="All accounts combined"
                  points={dashboard.totalProjection}
                  comparisonPoints={dashboard.zeroReturnTotalProjection}
                  palette={colorClasses.blue}
                />
                <ProjectionCard
                  title="Pension Wealth"
                  note="2nd + 3rd Pillar"
                  amount={dashboard.pensionWealth}
                  subtitle="Future pension capital"
                  points={dashboard.pensionProjection}
                  comparisonPoints={dashboard.zeroReturnPensionProjection}
                  palette={colorClasses.violet}
                />
                <ProjectionCard
                  title="Savings + Investments"
                  amount={dashboard.liquidWealth}
                  subtitle="Liquid and accessible wealth"
                  points={dashboard.savingsInvestmentProjection}
                  comparisonPoints={dashboard.zeroReturnSavingsInvestmentProjection}
                  palette={colorClasses.emerald}
                />
              </div>
            </>
          ) : activeView === 'expenses' ? (
            <ExpensesPage monthlyIncome={dashboard.income.monthlyNetIncome} />
          ) : activeView === 'mortgage' ? (
            <MortgagePage />
          ) : (
            <>
              <Header
                title="Contact"
                subtitle="Form for your inquiries"
                showActions={false}
                onExportPdf={handleExportPdf}
              />
              <div className="mt-6 max-w-2xl">
                <ContactContent />
              </div>
            </>
          )}
          <Footer />
        </section>
      </div>
    </main>
  );
}

function readSavedDashboardInputs(): SavedDashboardInputs {
  try {
    const savedValue = window.localStorage.getItem(DASHBOARD_STORAGE_KEY);
    return savedValue ? JSON.parse(savedValue) : {};
  } catch {
    return {};
  }
}

function saveDashboardInputs({
  assets,
  income,
  projectionYears,
}: {
  assets: FinancialAsset[];
  income: IncomePlan;
  projectionYears: number;
}) {
  try {
    window.localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify({
        assets: Object.fromEntries(
          assets.map((asset) => [
            asset.id,
            {
              amount: asset.amount,
              monthlyContribution: asset.monthlyContribution,
              annualReturn: asset.annualReturn,
            },
          ]),
        ),
        income: {
          monthlyNetIncome: income.monthlyNetIncome,
        },
        projectionYears,
      } satisfies SavedDashboardInputs),
    );
  } catch {
    // Ignore storage failures so the calculator remains usable in private or restricted browser modes.
  }
}

function mergeSavedAssets(savedAssets: SavedDashboardInputs['assets']) {
  return initialAssets.map((asset) => {
    const savedAsset = savedAssets?.[asset.id];

    return {
      ...asset,
      amount: getSavedNumber(savedAsset?.amount, asset.amount),
      monthlyContribution: getSavedNumber(savedAsset?.monthlyContribution, asset.monthlyContribution),
      annualReturn: getSavedNumber(savedAsset?.annualReturn, asset.annualReturn),
    };
  });
}

function mergeSavedIncome(savedIncome: SavedDashboardInputs['income']) {
  return {
    ...incomePlan,
    monthlyNetIncome: getSavedNumber(savedIncome?.monthlyNetIncome, incomePlan.monthlyNetIncome),
  };
}

function getSavedNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function Footer() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-center gap-2 pt-6 pb-2 text-center text-xs font-medium text-slate-600">
      <span>&copy; </span>
      <a
        className="text-slate-700 underline decoration-slate-400/60 underline-offset-2 transition hover:text-cyan-800"
        href="https://steplidia.pages.dev"
        target="_blank"
        rel="noopener noreferrer"
      >
        Lidia Stepanova
      </a>
      <span className="text-slate-400">·</span>
      <span className="group relative">
        <button
          className="text-slate-700 underline decoration-slate-400/60 underline-offset-2 transition hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-700/20"
          aria-describedby="privacy-tooltip"
          type="button"
        >
          Privacy
        </button>
        <span
          id="privacy-tooltip"
          role="tooltip"
          className={tooltipClasses('bottom-6 left-1/2 w-72 -translate-x-1/2 px-3 py-2 text-left leading-5')}
        >
          All data is stored locally in your browser and is not sent anywhere. Clearing site browser data will remove saved calculations.
        </span>
      </span>
    </footer>
  );
}

function YearsSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const percent = getPercent(value, 40);

  return (
    <section className="glass-panel mt-3 px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-32 items-baseline justify-between gap-3 sm:block">
          <p className="text-sm font-bold text-slate-900">Years</p>
          <p className="mt-1 text-sm text-slate-600">
            <span className="font-extrabold text-slate-950">{value}</span> years
          </p>
        </div>
        <div className="flex flex-1 items-center gap-4">
          <span className="text-xs font-bold text-slate-500">0</span>
          <input
            aria-label="Projection years"
            className="years-slider"
            max={40}
            min={0}
            step={1}
            style={{ '--slider-progress': `${percent}%` } as CSSProperties}
            type="range"
            value={value}
            onChange={(event) => onChange(Number(event.currentTarget.value))}
          />
          <span className="text-xs font-bold text-slate-500">40</span>
        </div>
      </div>
    </section>
  );
}
