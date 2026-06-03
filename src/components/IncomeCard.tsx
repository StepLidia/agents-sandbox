import { Clock3, WalletCards } from 'lucide-react';
import { currency, type IncomePlan } from '../finance';

export function IncomeCard({
  income,
  futureBuildingPercent,
}: {
  income: IncomePlan;
  futureBuildingPercent: number;
}) {
  const savingsPercent = (income.savingsContribution / income.monthlyNetIncome) * 100;
  const investmentPercent = (income.investmentContribution / income.monthlyNetIncome) * 100;
  const expensePercent = (income.otherExpenses / income.monthlyNetIncome) * 100;

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
          <WalletCards className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-extrabold">Monthly Disposable Income</h2>
      </div>
      <div className="mt-4 grid items-center gap-5 md:grid-cols-[190px_1fr]">
        <div>
          <SmallLabel>Monthly Net Income (CHF)</SmallLabel>
          <p className="mt-1 text-lg font-extrabold">{currency(income.monthlyNetIncome)}</p>
          <IncomeDonut
            income={income.monthlyNetIncome}
            savingsPercent={savingsPercent}
            investmentPercent={investmentPercent}
            expensePercent={expensePercent}
          />
        </div>
        <div>
          <SmallLabel>Allocation</SmallLabel>
          <div className="mt-2 overflow-hidden rounded-lg border border-white/55 bg-white/22">
            <AllocationRow color="bg-blue-600" label="To Savings Account" amount={income.savingsContribution} percent={savingsPercent} />
            <AllocationRow color="bg-violet-600" label="To Investments" amount={income.investmentContribution} percent={investmentPercent} />
            <AllocationRow color="bg-slate-400" label="Other Expenses" amount={income.otherExpenses} percent={expensePercent} />
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-blue-200/50 bg-blue-500/8 px-4 py-3 text-sm font-bold text-blue-800">
            <Clock3 className="h-4 w-4 shrink-0" />
            {futureBuildingPercent.toFixed(1)}% of your income is building your future.
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
  expensePercent,
}: {
  income: number;
  savingsPercent: number;
  investmentPercent: number;
  expensePercent: number;
}) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const savingsLength = (savingsPercent / 100) * circumference;
  const investmentLength = (investmentPercent / 100) * circumference;
  const expenseLength = (expensePercent / 100) * circumference;
  const savingsOffset = 0;
  const investmentOffset = -savingsLength;
  const expenseOffset = -(savingsLength + investmentLength);

  return (
    <svg viewBox="0 0 130 130" className="mt-2 h-36 w-36">
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
        stroke="#7c3aed"
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
        stroke="#4fc3f7"
        strokeDasharray={`${expenseLength} ${circumference - expenseLength}`}
        strokeDashoffset={expenseOffset}
        strokeLinecap="round"
        strokeWidth="18"
        transform="rotate(-90 65 65)"
      />
      <circle cx="65" cy="65" r="31" fill="rgba(255,255,255,.72)" />
      <text x="65" y="62" textAnchor="middle" className="fill-slate-900 text-[18px] font-extrabold">
        {currency(income)}
      </text>
      <text x="65" y="78" textAnchor="middle" className="fill-slate-600 text-[11px] font-bold">
        CHF
      </text>
    </svg>
  );
}

function AllocationRow({ color, label, amount, percent }: { color: string; label: string; amount: number; percent: number }) {
  return (
    <div className="grid grid-cols-[1fr_112px_42px] items-center gap-3 border-b border-slate-300/35 px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3 text-xs font-semibold">
        <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
        <span className="truncate">{label}</span>
      </div>
      <span className="glass-input justify-between py-2 text-sm">
        <strong>{currency(amount)}</strong>
        CHF
      </span>
      <span className="text-right text-xs font-semibold text-slate-600">{percent.toFixed(1)}%</span>
    </div>
  );
}

function SmallLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-extrabold text-slate-800">{children}</p>;
}
