import { Clock3, Wallet } from 'lucide-react';
import { formatPercent, getPercent } from '../calculations/percent';
import { currency, type IncomePlan } from '../finance';
import { useEditableNumber } from '../hooks/useEditableNumber';

export function IncomeCard({
  income,
  futureBuildingPercent,
  onChange,
}: {
  income: IncomePlan;
  futureBuildingPercent: number;
  onChange: (field: keyof Pick<IncomePlan, 'monthlyNetIncome'>, value: number) => void;
}) {
  const monthlyNetIncome = Math.max(0, income.monthlyNetIncome);
  const savingsPercent = getPercent(income.savingsContribution, monthlyNetIncome);
  const investmentPercent = getPercent(income.investmentContribution, monthlyNetIncome);
  const pillar3Percent = getPercent(income.pillar3Contribution, monthlyNetIncome);
  const expensePercent = getPercent(income.otherExpenses, monthlyNetIncome);

  return (
    <section className="glass-panel flex h-full flex-col p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
          <Wallet className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold">Monthly Disposable Income</h2>
      </div>
      <div className="mt-4 grid items-start gap-5 md:grid-cols-[190px_1fr]">
        <div>
          <SmallLabel>Monthly Net Income (CHF)</SmallLabel>
          <CurrencyInput
            value={income.monthlyNetIncome}
            className="mt-2 h-11 w-full text-lg"
            onChange={(value) => onChange('monthlyNetIncome', value)}
          />
          <IncomeDonut
            income={income.monthlyNetIncome}
            savingsPercent={savingsPercent}
            investmentPercent={investmentPercent}
            pillar3Percent={pillar3Percent}
            expensePercent={expensePercent}
          />
        </div>
        <div>
          <SmallLabel>Allocation</SmallLabel>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-300/30 bg-white/20">
            <AllocationRow
              color="bg-blue-600"
              label="To Savings Account"
              amount={income.savingsContribution}
              percent={savingsPercent}
              readOnly
            />
            <AllocationRow
              color="bg-rose-400"
              label="To Investments"
              amount={income.investmentContribution}
              percent={investmentPercent}
              readOnly
            />
            <AllocationRow
              color="bg-cyan-500"
              label="3rd Pillar"
              amount={income.pillar3Contribution}
              percent={pillar3Percent}
              readOnly
            />
            <AllocationRow
              color="bg-sky-400"
              label="Expenses"
              amount={income.otherExpenses}
              percent={expensePercent}
              readOnly
            />
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-blue-200/50 bg-blue-500/8 px-4 py-3 text-sm font-bold text-blue-800">
            <Clock3 className="h-4 w-4 shrink-0" />
            {formatPercent(futureBuildingPercent, 100)} of your income is building your future.
          </div>
        </div>
      </div>
    </section>
  );
}

function IncomeDonut({
  income,
  savingsPercent,
  investmentPercent,
  pillar3Percent,
  expensePercent,
}: {
  income: number;
  savingsPercent: number;
  investmentPercent: number;
  pillar3Percent: number;
  expensePercent: number;
}) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const safeSavingsPercent = Math.max(0, Math.min(100, savingsPercent));
  const safeInvestmentPercent = Math.max(0, Math.min(100 - safeSavingsPercent, investmentPercent));
  const safePillar3Percent = Math.max(0, Math.min(100 - safeSavingsPercent - safeInvestmentPercent, pillar3Percent));
  const safeExpensePercent = Math.max(
    0,
    Math.min(100 - safeSavingsPercent - safeInvestmentPercent - safePillar3Percent, expensePercent),
  );
  const savingsLength = (safeSavingsPercent / 100) * circumference;
  const investmentLength = (safeInvestmentPercent / 100) * circumference;
  const pillar3Length = (safePillar3Percent / 100) * circumference;
  const expenseLength = (safeExpensePercent / 100) * circumference;
  const savingsOffset = 0;
  const investmentOffset = -savingsLength;
  const pillar3Offset = -(savingsLength + investmentLength);
  const expenseOffset = -(savingsLength + investmentLength + pillar3Length);

  return (
    <svg viewBox="0 0 130 130" className="mx-auto mt-4 h-36 w-36">
      <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth="18" />
      <circle
        cx="65"
        cy="65"
        r={radius}
        fill="none"
        stroke="#2563eb"
        strokeDasharray={`${savingsLength} ${circumference - savingsLength}`}
        strokeDashoffset={savingsOffset}
        strokeLinecap="round"
        strokeWidth="18"
        transform="rotate(-90 65 65)"
      />
      <circle
        cx="65"
        cy="65"
        r={radius}
        fill="none"
        stroke="#fb7185"
        strokeDasharray={`${investmentLength} ${circumference - investmentLength}`}
        strokeDashoffset={investmentOffset}
        strokeLinecap="round"
        strokeWidth="18"
        transform="rotate(-90 65 65)"
      />
      <circle
        cx="65"
        cy="65"
        r={radius}
        fill="none"
        stroke="#0891b2"
        strokeDasharray={`${pillar3Length} ${circumference - pillar3Length}`}
        strokeDashoffset={pillar3Offset}
        strokeLinecap="round"
        strokeWidth="18"
        transform="rotate(-90 65 65)"
      />
      <circle
        cx="65"
        cy="65"
        r={radius}
        fill="none"
        stroke="#4fc3f7"
        strokeDasharray={`${expenseLength} ${circumference - expenseLength}`}
        strokeDashoffset={expenseOffset}
        strokeLinecap="round"
        strokeWidth="18"
        transform="rotate(-90 65 65)"
      />
      <circle cx="65" cy="65" r="31" fill="rgba(255,255,255,.72)" />
      <text x="65" y="62" textAnchor="middle" className="fill-slate-900 text-[18px] font-bold">
        {currency(income)}
      </text>
      <text x="65" y="78" textAnchor="middle" className="fill-slate-600 text-[11px] font-bold">
        CHF
      </text>
    </svg>
  );
}

function AllocationRow({
  color,
  label,
  amount,
  percent,
  onChange,
  readOnly = false,
}: {
  color: string;
  label: string;
  amount: number;
  percent: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_112px_42px] items-center gap-3 border-b border-slate-300/35 px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3 text-sm font-semibold">
        <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
        <span className="truncate">{label}</span>
      </div>
      {readOnly ? <CurrencyValue value={amount} /> : <CurrencyInput value={amount} onChange={onChange ?? (() => undefined)} />}
      <span className="text-right text-sm font-semibold text-slate-600">{formatPercent(percent, 100)}</span>
    </div>
  );
}

function CurrencyValue({ value }: { value: number }) {
  return (
    <span className="flex min-w-0 items-center justify-between gap-3 py-2 text-sm font-normal text-slate-700">
      <span className="min-w-0 truncate">{currency(value)}</span>
      <span className="text-sm font-normal text-slate-600">CHF</span>
    </span>
  );
}

function CurrencyInput({
  value,
  className = '',
  onChange,
}: {
  value: number;
  className?: string;
  onChange: (value: number) => void;
}) {
  const { inputValue, onInputChange } = useEditableNumber(value, onChange, { format: 'money' });

  return (
    <span className={`glass-input justify-between py-2 text-sm ${className}`}>
      <input
        className="w-full min-w-0 bg-transparent font-black text-slate-950 outline-none"
        inputMode="numeric"
        type="text"
        value={inputValue}
        onChange={(event) => onInputChange(event.currentTarget.value)}
      />
      <span className="text-xs font-black text-slate-600">CHF</span>
    </span>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-bold text-slate-800">{children}</p>;
}
