import { Building2, CircleHelp, Landmark, ShieldCheck, TrendingUp } from 'lucide-react';
import { currency, type AssetKind, type calculateDashboard, type FinancialAsset } from '../finance';
import { colorClasses } from './colors';

type Asset = ReturnType<typeof calculateDashboard>['assets'][number];

export function AssetCard({
  asset,
  onChange,
}: {
  asset: Asset;
  onChange: (id: AssetKind, field: keyof Pick<FinancialAsset, 'amount' | 'annualReturn' | 'years'>, value: number) => void;
}) {
  const Icon =
    asset.id === 'savings' ? Landmark : asset.id === 'investments' ? TrendingUp : asset.id === 'pillar2' ? ShieldCheck : Building2;
  const colors = colorClasses[asset.color];

  return (
    <article className="glass-panel p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-2xl border ${colors.border} ${colors.bg} ${colors.text}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-950">{asset.label}</h2>
          <p className="text-xs text-slate-600">{asset.subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2.5 text-xs">
        <EditableField
          label="Current Amount"
          value={asset.amount}
          suffix="CHF"
          min={0}
          step={500}
          onChange={(value) => onChange(asset.id, 'amount', value)}
        />
        <EditableField
          label="Expected Return (%)"
          value={asset.annualReturn}
          suffix="%"
          step={0.05}
          onChange={(value) => onChange(asset.id, 'annualReturn', value)}
        />
        <EditableField
          label="Years"
          value={asset.years}
          suffix="years"
          min={0}
          step={1}
          onChange={(value) => onChange(asset.id, 'years', value)}
        />
      </div>
      <div className="mt-4 border-t border-slate-300/45 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            Future Value
            <CircleHelp className="h-4 w-4 text-slate-500" />
          </div>
          <div className={`text-right text-xl font-bold ${colors.text}`}>
            {currency(asset.futureValue)}
            <span className="ml-1 text-xs">CHF</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function EditableField({
  label,
  value,
  suffix,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number;
  suffix: string;
  min?: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_112px] items-center gap-3">
      <span className="font-medium text-slate-800">{label}</span>
      <span className="glass-input flex justify-between py-2">
        <input
          className="w-full min-w-0 bg-transparent font-bold text-slate-950 outline-none"
          min={min}
          step={step}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(event.currentTarget.valueAsNumber || 0)}
        />
        <span className="text-slate-600">{suffix}</span>
      </span>
    </label>
  );
}
