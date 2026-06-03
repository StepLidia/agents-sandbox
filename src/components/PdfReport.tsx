import { currency, type IncomePlan, type InsightAmounts, type calculateDashboard } from '../finance';
import { colorClasses } from './colors';
import { InsightsCard } from './InsightsCard';
import { ProjectionCard } from './ProjectionCard';

type DashboardData = ReturnType<typeof calculateDashboard>;

export function PdfReport({
  dashboard,
  projectionYears,
}: {
  dashboard: DashboardData;
  projectionYears: number;
}) {
  return (
    <article className="w-235 bg-[#eef5fb] p-8 text-slate-950">
      <section className="grid grid-cols-3 gap-4">
        <ReportMetric label="Total Wealth" value={dashboard.totalWealth} hint={`Projected in ${projectionYears} years`} />
        <ReportMetric label="Pension Wealth" value={dashboard.pensionWealth} hint="2nd + 3rd Pillar" />
        <ReportMetric label="Savings + Investments" value={dashboard.liquidWealth} hint="Accessible wealth" />
      </section>

      <section className="mt-5">
        <ReportHeading>Account Details</ReportHeading>
        <div className="grid grid-cols-2 gap-4">
          {dashboard.assets.map((asset) => (
            <AssetReportCard key={asset.id} asset={asset} />
          ))}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-[1.05fr_.95fr] gap-4">
        <IncomeReportCard income={dashboard.income} futureBuildingPercent={dashboard.futureBuildingPercent} />
        <InsightsReportCard insightAmounts={dashboard.insightAmounts} projectionYears={projectionYears} />
      </section>

      <section className="mt-5">
        <ReportHeading>Projection Charts</ReportHeading>
        <div className="grid gap-4">
          <ProjectionCard
            title="Total Wealth projection"
            amount={dashboard.totalWealth}
            subtitle="All accounts combined"
            points={dashboard.totalProjection}
            comparisonPoints={dashboard.zeroReturnTotalProjection}
            palette={colorClasses.blue}
          />
          <ProjectionCard
            title="Pension Wealth projection"
            note="2nd + 3rd Pillar"
            amount={dashboard.pensionWealth}
            subtitle="Future pension capital"
            points={dashboard.pensionProjection}
            comparisonPoints={dashboard.zeroReturnPensionProjection}
            palette={colorClasses.violet}
          />
          <ProjectionCard
            title="Savings + Investments projection"
            amount={dashboard.liquidWealth}
            subtitle="Liquid and accessible wealth"
            points={dashboard.savingsInvestmentProjection}
            comparisonPoints={dashboard.zeroReturnSavingsInvestmentProjection}
            palette={colorClasses.emerald}
          />
        </div>
      </section>
    </article>
  );
}

function ReportHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-bold text-slate-950">{children}</h2>;
}

function ReportMetric({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-blue-700">{formatMoney(value)}</p>
      <p className="mt-1 text-xs text-slate-600">{hint}</p>
    </div>
  );
}

function AssetReportCard({ asset }: { asset: DashboardData['assets'][number] }) {
  const monthlyLabel = asset.id === 'pillar2' ? 'Monthly saving part' : 'Monthly contribution';

  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold">{asset.label}</h3>
          <p className="text-xs text-slate-600">{asset.subtitle}</p>
        </div>
        <p className="text-right text-lg font-bold text-slate-950">{formatMoney(asset.futureValue)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <ReportField label="Current amount" value={formatMoney(asset.amount)} />
        <ReportField label={monthlyLabel} value={formatMoney(asset.monthlyContribution)} />
        <ReportField label="Expected yearly return" value={`${asset.annualReturn.toFixed(2)}%`} />
        <ReportField label="Years" value={`${asset.years} years`} />
      </div>
    </div>
  );
}

function IncomeReportCard({
  income,
  futureBuildingPercent,
}: {
  income: IncomePlan;
  futureBuildingPercent: number;
}) {
  const rows = [
    ['Monthly net income', income.monthlyNetIncome],
    ['To Savings Account', income.savingsContribution],
    ['To Investments', income.investmentContribution],
    ['3rd Pillar', income.pillar3Contribution],
    ['Expenses', income.otherExpenses],
  ] as const;

  return (
    <section className="glass-panel p-4">
      <h2 className="text-base font-bold">Monthly Disposable Income Allocation</h2>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-2 text-sm last:border-0">
            <span className="text-slate-600">{label}</span>
            <span className="font-semibold text-slate-950">{formatMoney(value)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800">
        {futureBuildingPercent.toFixed(1)}% of income is allocated to future wealth.
      </p>
    </section>
  );
}

function InsightsReportCard({
  insightAmounts,
  projectionYears,
}: {
  insightAmounts: InsightAmounts;
  projectionYears: number;
}) {
  return (
    <div className="[&_.glass-panel]:h-full">
      <InsightsCard insightAmounts={insightAmounts} projectionYears={projectionYears} />
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function formatMoney(value: number) {
  return `${currency(value)} CHF`;
}
