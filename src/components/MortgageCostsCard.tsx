import { Calculator, ReceiptText, RefreshCw, type LucideIcon } from 'lucide-react';
import {
  calculateMortgageCosts,
  type MortgageCostAmounts,
  type MortgageCostItem,
  type MortgageCostItemId,
} from '../calculations/mortgageCalculations';
import { colorClasses, type ChartPalette } from '../constants/colors';
import { currency } from '../finance';
import { useEditableNumber } from '../hooks/useEditableNumber';

export function MortgageCostsCard({
  costAmounts,
  maintenanceRate,
  onCostAmountChange,
  onResetCosts,
  propertyPrice,
}: {
  costAmounts: MortgageCostAmounts;
  maintenanceRate: number;
  onCostAmountChange: (id: MortgageCostItemId, amount: number) => void;
  onResetCosts: () => void;
  propertyPrice: number;
}) {
  const costs = calculateMortgageCosts({ costAmounts, maintenanceRate, propertyPrice });

  return (
    <section className="glass-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-normal text-slate-950 md:text-lg">3. Costs & Fees</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            One-time purchasing costs and ongoing annual ownership costs
          </p>
        </div>
        <button
          aria-label="Reset costs and fees to defaults"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-300/40 bg-white/50 text-slate-600 transition hover:border-blue-300/50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
          type="button"
          onClick={onResetCosts}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
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
          onCostAmountChange={onCostAmountChange}
        />
        <MortgageCostPanel
          color={colorClasses.coral}
          icon={Calculator}
          items={costs.ongoingAnnualCosts}
          monthlyValue={costs.monthlyOngoingCosts}
          title="Ongoing Annual Costs"
          totalLabel="Total Annual Costs"
          totalValue={costs.totalOngoingAnnualCosts}
          onCostAmountChange={onCostAmountChange}
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
  onCostAmountChange,
}: {
  color: ChartPalette;
  icon: LucideIcon;
  items: MortgageCostItem[];
  monthlyValue?: number;
  title: string;
  titleDetail?: string;
  totalLabel: string;
  totalValue: number;
  onCostAmountChange: (id: MortgageCostItemId, amount: number) => void;
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
          <MortgageCostRow key={item.id} item={item} onCostAmountChange={onCostAmountChange} />
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

function MortgageCostRow({
  item,
  onCostAmountChange,
}: {
  item: MortgageCostItem;
  onCostAmountChange: (id: MortgageCostItemId, amount: number) => void;
}) {
  const { inputValue, onInputChange } = useEditableNumber(item.amount, (amount) => onCostAmountChange(item.id, amount), {
    format: 'money',
  });

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-bold text-slate-600">{item.label}</span>
      <span className="glass-input w-40 shrink-0 justify-between gap-2 px-2 py-1">
        <input
          aria-label={`${item.label} cost amount`}
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
