import type { LucideIcon } from 'lucide-react';
import { Coins, LineChart, PiggyBank } from 'lucide-react';
import { currency, type FinancialAsset } from '../finance';
import { colorClasses } from './colors';

export function SummaryCard({
  totalWealth,
  pensionWealth,
  liquidWealth,
}: {
  totalWealth: number;
  pensionWealth: number;
  liquidWealth: number;
}) {
  return (
    <section className="glass-panel flex h-full flex-col p-4">
      <h2 className="text-sm font-bold">
        Summary <span className="font-medium text-slate-600">(in 30 years)</span>
      </h2>
      <div className="mt-3 flex flex-1 flex-col gap-2">
        <SummaryRow icon={Coins} label="Total Wealth" amount={totalWealth} hint="All assets combined" color="blue" />
        <SummaryRow icon={PiggyBank} label="Pension Wealth" amount={pensionWealth} hint="Locked until retirement" color="emerald" />
        <SummaryRow icon={LineChart} label="Savings + Investments" amount={liquidWealth} hint="Flexible and accessible" color="violet" />
      </div>
    </section>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  amount,
  hint,
  color,
}: {
  icon: LucideIcon;
  label: string;
  amount: number;
  hint: string;
  color: FinancialAsset['color'];
}) {
  const colors = colorClasses[color];

  return (
    <div className="flex flex-1 items-center gap-3 rounded-lg border border-white/55 bg-white/28 p-3 shadow-inner">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${colors.bg} ${colors.text}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs text-slate-700">{label}</p>
        <p className="text-lg font-extrabold">
          {currency(amount)} <span className="text-xs font-medium">CHF</span>
        </p>
        <p className="text-xs text-slate-600">{hint}</p>
      </div>
    </div>
  );
}
