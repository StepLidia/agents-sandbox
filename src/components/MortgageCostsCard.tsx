import { Calculator, ReceiptText, type LucideIcon } from 'lucide-react';
import { calculateMortgageCosts, type MortgageCostItem } from '../calculations/mortgageCalculations';
import { colorClasses, type ChartPalette } from '../constants/colors';
import { currency } from '../finance';

export function MortgageCostsCard({
  maintenanceRate,
  propertyPrice,
}: {
  maintenanceRate: number;
  propertyPrice: number;
}) {
  const costs = calculateMortgageCosts({ maintenanceRate, propertyPrice });

  return (
    <section className="glass-panel p-4">
      <div>
        <h2 className="text-base font-bold tracking-normal text-slate-950 md:text-lg">3. Costs & Fees</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          One-time purchasing costs and ongoing annual ownership costs
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MortgageCostPanel
          color={colorClasses.cyan}
          icon={ReceiptText}
          items={costs.oneTimeCosts}
          title="One-time Costs"
          titleDetail="Paid at purchase"
          totalLabel="Total One-time Costs"
          totalValue={costs.totalOneTimeCosts}
        />
        <MortgageCostPanel
          color={colorClasses.coral}
          icon={Calculator}
          items={costs.ongoingAnnualCosts}
          monthlyValue={costs.monthlyOngoingCosts}
          title="Ongoing Annual Costs"
          totalLabel="Total Annual Costs"
          totalValue={costs.totalOngoingAnnualCosts}
        />
      </div>
    </section>
  );
}

function MortgageCostPanel({
  color,
  icon: Icon,
  items,
  monthlyValue,
  title,
  titleDetail,
  totalLabel,
  totalValue,
}: {
  color: ChartPalette;
  icon: LucideIcon;
  items: MortgageCostItem[];
  monthlyValue?: number;
  title: string;
  titleDetail?: string;
  totalLabel: string;
  totalValue: number;
}) {
  return (
    <article className="glass-panel flex h-full flex-col p-4">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${color.bg} ${color.text}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-sm font-bold text-slate-950">
          {title}
          {titleDetail && <span className="text-slate-600"> ({titleDetail})</span>}
        </h3>
      </div>

      <div className="mt-4 space-y-2 border-b border-slate-300/50 pb-4">
        {items.map((item) => (
          <MortgageCostRow key={item.label} item={item} />
        ))}
      </div>

      <div className={`mt-auto flex items-center justify-between gap-4 pt-4 text-sm font-bold ${color.text}`}>
        <span>{totalLabel}</span>
        <span className="text-right whitespace-nowrap">
          {currency(totalValue)} CHF
          {monthlyValue !== undefined && ` (${currency(monthlyValue)} CHF / month)`}
        </span>
      </div>
    </article>
  );
}

function MortgageCostRow({ item }: { item: MortgageCostItem }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-600">
      <span>{item.label}</span>
      <span className="whitespace-nowrap text-slate-950">{currency(item.amount)} CHF</span>
    </div>
  );
}
