import { Lightbulb } from 'lucide-react';
import { currency, type InsightAmounts } from '../finance';

export function InsightsCard({
  insightAmounts,
  projectionYears,
}: {
  insightAmounts: InsightAmounts;
  projectionYears: number;
}) {
  return (
    <section className="glass-panel flex h-full flex-col p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-500/10 text-blue-600">
          <Lightbulb className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-bold">Key Insights</h2>
      </div>
      <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-800 marker:text-blue-600">
        <li>You're building a solid financial foundation.</li>
        <li>
          <InsightValue>+200 CHF</InsightValue> in investments per month may generate additional{' '}
          <InsightValue>+{currency(insightAmounts.extraInvestmentContributionValue)} CHF</InsightValue> in {projectionYears} years.
        </li>
        <li>
          If markets are favourable, <InsightValue>+1%</InsightValue> in returns on your investments will generate{' '}
          <InsightValue>+{currency(insightAmounts.favourableMarketReturnValue)} CHF</InsightValue> in {projectionYears} years.
        </li>
        <li>
          If you invested <InsightValue>10,000 CHF</InsightValue> from your savings account, you would add{' '}
          <InsightValue>+{currency(insightAmounts.savingsToInvestmentValue)} CHF</InsightValue> to your total wealth in{' '}
          {projectionYears} years.
        </li>
      </ul>
    </section>
  );
}

function InsightValue({ children }: { children: React.ReactNode }) {
  return <span className="font-extrabold text-slate-950">{children}</span>;
}
