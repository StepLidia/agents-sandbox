import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Building2, CircleHelp, Goal, Landmark, ShieldCheck, TrendingUp } from 'lucide-react';
import { currency, type AssetKind, type calculateDashboard, type FinancialAsset } from '../finance';
import { colorClasses } from './colors';

type Asset = ReturnType<typeof calculateDashboard>['assets'][number];

export function AssetCard({
  asset,
  onChange,
}: {
  asset: Asset;
  onChange: (
    id: AssetKind,
    field: keyof Pick<FinancialAsset, 'amount' | 'monthlyContribution' | 'annualReturn'>,
    value: number,
  ) => void;
}) {
  const Icon =
    asset.id === 'savings' ? Landmark : asset.id === 'investments' ? TrendingUp : asset.id === 'pillar2' ? ShieldCheck : Building2;
  const colors = colorClasses[asset.color];
  const [isSavingPartHintOpen, setIsSavingPartHintOpen] = useState(false);
  const savingPartHintRef = useRef<HTMLSpanElement>(null);
  const isPillar2 = asset.id === 'pillar2';

  useEffect(() => {
    if (!isSavingPartHintOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!savingPartHintRef.current?.contains(event.target as Node)) {
        setIsSavingPartHintOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isSavingPartHintOpen]);

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
          label={isPillar2 ? 'Monthly saving part' : 'Monthly Contribution'}
          labelExtra={
            isPillar2 ? (
              <span ref={savingPartHintRef} className="relative">
                <button
                  type="button"
                  className="grid h-5 w-5 place-items-center rounded-full text-slate-500 transition hover:bg-white/50 hover:text-blue-700"
                  aria-label="Show monthly saving part hint"
                  onClick={() => setIsSavingPartHintOpen((isOpen) => !isOpen)}
                >
                  <CircleHelp className="h-4 w-4" />
                </button>
                {isSavingPartHintOpen && (
                  <span className="absolute left-0 top-6 z-20 w-56 rounded-lg border border-white/60 bg-white/85 p-3 text-xs font-medium leading-5 text-slate-700 shadow-xl shadow-slate-400/20 backdrop-blur-xl">
                    You can find this value in your most recent annual pension fund statement.
                  </span>
                )}
              </span>
            ) : undefined
          }
          value={asset.monthlyContribution}
          suffix="CHF"
          min={0}
          step={100}
          onChange={(value) => onChange(asset.id, 'monthlyContribution', value)}
        />
        <EditableField
          label="Expected Yearly Return (%)"
          value={asset.annualReturn}
          suffix="%"
          step={0.05}
          onChange={(value) => onChange(asset.id, 'annualReturn', value)}
        />
        <ReadonlyField label="Years" value={asset.years} suffix="years" />
      </div>
      <div className="mt-4 border-t border-slate-300/45 pt-4">
        <div className="flex min-h-7 items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Goal className={`h-4 w-4 ${colors.text}`} />
            Future Value
          </div>
          <div className={`text-right text-xl font-bold leading-none ${colors.text}`}>
            {currency(asset.futureValue)}
            <span className="ml-1 text-xs">CHF</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReadonlyField({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="grid grid-cols-[1fr_112px] items-center gap-3">
      <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-slate-800">
        <span className="truncate">{label}</span>
      </span>
      <span className="glass-input flex justify-between py-2 text-[14px] font-normal text-slate-700">
        <span>{value}</span>
        <span className="text-sm font-normal text-slate-600">{suffix}</span>
      </span>
    </div>
  );
}

function EditableField({
  label,
  labelExtra,
  value,
  suffix,
  min,
  step,
  onChange,
}: {
  label: string;
  labelExtra?: ReactNode;
  value: number;
  suffix: string;
  min?: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_112px] items-center gap-3">
      <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-medium text-slate-800">
        <span className="truncate">{label}</span>
        {labelExtra}
      </span>
      <span className="glass-input flex justify-between py-2 text-[14px]">
        <input
          aria-label={label}
          className="w-full min-w-0 bg-transparent font-normal text-slate-950 outline-none"
          min={min}
          step={step}
          type="number"
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(event.currentTarget.valueAsNumber || 0)}
        />
        <span className="text-slate-600">{suffix}</span>
      </span>
    </div>
  );
}
