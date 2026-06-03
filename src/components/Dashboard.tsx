import { useMemo, useState } from 'react';
import { assets as initialAssets, calculateDashboard, incomePlan, type AssetKind, type FinancialAsset, type IncomePlan } from '../finance';
import { colorClasses } from './colors';
import { Header } from './Header';
import { IncomeCard } from './IncomeCard';
import { InsightsCard } from './InsightsCard';
import { ProjectionCard } from './ProjectionCard';
import { Sidebar } from './Sidebar';
import { SummaryCard } from './SummaryCard';
import { AssetCard } from './AssetCard';

export function Dashboard() {
  const [assets, setAssets] = useState<FinancialAsset[]>(initialAssets);
  const [income, setIncome] = useState<IncomePlan>(incomePlan);
  const dashboard = useMemo(() => calculateDashboard(assets, income), [assets, income]);

  function updateAsset(id: AssetKind, field: keyof Pick<FinancialAsset, 'amount' | 'annualReturn' | 'years'>, value: number) {
    setAssets((currentAssets) =>
      currentAssets.map((asset) => (asset.id === id ? { ...asset, [field]: value } : asset)),
    );
  }

  function updateIncome(field: keyof IncomePlan, value: number) {
    setIncome((currentIncome) => ({ ...currentIncome, [field]: value }));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#e8eef8] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(37,99,235,.23),transparent_31%),radial-gradient(circle_at_72%_7%,rgba(124,58,237,.20),transparent_29%),radial-gradient(circle_at_82%_86%,rgba(148,163,184,.24),transparent_32%),linear-gradient(135deg,#f8fbff_0%,#dce7f6_47%,#f2f5fa_100%)]" />
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[232px_1fr]">
        <Sidebar />
        <section className="px-4 py-4 sm:px-5 xl:px-6">
          <Header />
          <div className="mt-4 grid gap-3 xl:grid-cols-4">
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
              />
            </div>
            <div className="h-full">
              <InsightsCard />
            </div>
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <ProjectionCard
              title="Total Wealth Over Time"
              amount={dashboard.totalWealth}
              subtitle="All accounts combined"
              points={dashboard.totalProjection}
              palette={colorClasses.blue}
            />
            <ProjectionCard
              title="Pension Wealth"
              note="2nd + 3rd Pillar"
              amount={dashboard.pensionWealth}
              subtitle="Future pension capital"
              points={dashboard.pensionProjection}
              palette={colorClasses.violet}
            />
            <ProjectionCard
              title="Savings + Investments"
              amount={dashboard.liquidWealth}
              subtitle="Liquid and accessible wealth"
              points={dashboard.savingsInvestmentProjection}
              palette={colorClasses.emerald}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
