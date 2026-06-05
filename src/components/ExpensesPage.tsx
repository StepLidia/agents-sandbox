import { useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChartLine,
  Download,
  Home,
  MoreVertical,
  PiggyBank,
  Star,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip, type PieSectorShapeProps } from 'recharts';
import { currency } from '../finance';

const EXPENSES_STORAGE_KEY = 'growly-expenses-v1';
const DEFAULT_MONTHLY_INCOME = 6000;

type ExpenseCategory = {
  id: string;
  label: string;
  value: number;
  color: string;
  kind: 'essential' | 'lifestyle';
};

const defaultCategories: ExpenseCategory[] = [
  { id: 'rent', label: 'Rent', value: 1600, color: '#2563eb', kind: 'essential' },
  { id: 'food', label: 'Food', value: 700, color: '#42ba85', kind: 'essential' },
  { id: 'taxes', label: 'Taxes', value: 500, color: '#f59e0b', kind: 'essential' },
  { id: 'insurance', label: 'Insurance', value: 350, color: '#a78bfa', kind: 'essential' },
  { id: 'gas', label: 'Gas', value: 300, color: '#ff6b4a', kind: 'lifestyle' },
  { id: 'electricity', label: 'Electricity', value: 250, color: '#22b8cf', kind: 'essential' },
  { id: 'internet', label: 'Internet', value: 200, color: '#d8a1c4', kind: 'essential' },
  { id: 'mobile', label: 'Mobile', value: 130, color: '#ddb44b', kind: 'lifestyle' },
  { id: 'garage', label: 'Garage', value: 100, color: '#e6d34c', kind: 'lifestyle' },
  { id: 'subscriptions', label: 'Subscriptions', value: 90, color: '#b39ddb', kind: 'lifestyle' },
  { id: 'utilities', label: 'Utilities', value: 30, color: '#dbe3ef', kind: 'essential' },
];

export function ExpensesPage({ monthlyIncome = DEFAULT_MONTHLY_INCOME }: { monthlyIncome?: number }) {
  const [categories, setCategories] = useState<ExpenseCategory[]>(readSavedExpenses);
  const totalExpenses = useMemo(() => categories.reduce((sum, category) => sum + category.value, 0), [categories]);
  const essentialExpenses = useMemo(
    () => categories.filter(({ kind }) => kind === 'essential').reduce((sum, category) => sum + category.value, 0),
    [categories],
  );
  const lifestyleExpenses = totalExpenses - essentialExpenses;
  const savingsPotential = Math.max(monthlyIncome - totalExpenses, 0);
  const topDrivers = [...categories].sort((first, second) => second.value - first.value).slice(0, 3);

  useEffect(() => {
    saveExpenses(categories);
  }, [categories]);

  function updateCategory(id: string, value: number) {
    setCategories((currentCategories) =>
      currentCategories.map((category) => (category.id === id ? { ...category, value: Math.max(0, value) } : category)),
    );
  }

  return (
    <>
      <ExpensesHeader />
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={WalletCards}
          iconClassName="bg-blue-600/10 text-blue-600"
          title="Total Monthly Expenses"
          amount={totalExpenses}
          helper={`${formatPercent(totalExpenses, monthlyIncome)} of net income`}
          helperClassName="text-blue-600"
          trend="6.2%"
          trendDirection="up"
          trendTone="bad"
        />
        <MetricCard
          icon={Home}
          iconClassName="bg-emerald-500/12 text-emerald-600"
          title="Essential Expenses"
          amount={essentialExpenses}
          helper={`${formatPercent(essentialExpenses, totalExpenses)} of total expenses`}
          helperClassName="text-emerald-600"
          trend="3.8%"
          trendDirection="up"
          trendTone="bad"
        />
        <MetricCard
          icon={Star}
          iconClassName="bg-amber-500/12 text-amber-500"
          title="Lifestyle Expenses"
          amount={lifestyleExpenses}
          helper={`${formatPercent(lifestyleExpenses, totalExpenses)} of total expenses`}
          helperClassName="text-amber-500"
          trend="12.5%"
          trendDirection="down"
          trendTone="good"
        />
        <MetricCard
          icon={TrendingUp}
          iconClassName="bg-violet-500/12 text-violet-600"
          title="Monthly Savings Potential"
          amount={savingsPotential}
          helper={`${formatPercent(savingsPotential, monthlyIncome)} of net income`}
          helperClassName="text-violet-600"
          trend="14.3%"
          trendDirection="up"
          trendTone="good"
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <section className="glass-panel flex min-h-0 flex-col p-4">
          <h2 className="text-sm font-bold text-slate-950">Monthly Expense Distribution</h2>
          <div className="mt-4 grid flex-1 place-content-center items-center gap-8 md:grid-cols-[minmax(24rem,30rem)_12rem]">
            <ExpenseDonut categories={categories} totalExpenses={totalExpenses} />
            <CategoryLegend categories={categories} />
          </div>
        </section>

        <section className="glass-panel p-4">
          <h2 className="text-sm font-bold text-slate-950">Category Breakdown</h2>
          <div className="mt-4 space-y-2">
            {categories.map((category) => (
              <ExpenseBreakdownRow
                key={category.id}
                category={category}
                percent={getPercent(category.value, totalExpenses)}
                totalExpenses={totalExpenses}
                onChange={updateCategory}
              />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between pt-2 text-sm font-bold">
            <span>Total Expenses</span>
            <span>{currency(totalExpenses)} CHF</span>
          </div>
        </section>
      </div>

      <div className="mt-3 grid items-stretch gap-3 xl:grid-cols-3">
        <IncomeVsExpenses monthlyIncome={monthlyIncome} totalExpenses={totalExpenses} savingsPotential={savingsPotential} />
        <TopCostDrivers drivers={topDrivers} totalExpenses={totalExpenses} />
        <ExpenseInsights categories={categories} totalExpenses={totalExpenses} savingsPotential={savingsPotential} monthlyIncome={monthlyIncome} />
      </div>
    </>
  );
}

function ExpensesHeader() {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Expenses</h1>
        <p className="mt-1 text-sm text-slate-700">Track your spending. Understand your habits. Take control.</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="glass-control export-button font-semibold" type="button">
          <CalendarDays className="h-4 w-4" />
          May 2025
        </button>
        <button className="glass-icon h-10 w-10" aria-label="View expense trend" type="button">
          <ChartLine className="h-4 w-4" />
        </button>
        <button className="glass-icon h-10 w-10" aria-label="Download expenses" type="button">
          <Download className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function MetricCard({
  icon: Icon,
  iconClassName,
  title,
  amount,
  helper,
  helperClassName,
  trend,
  trendDirection,
  trendTone,
}: {
  icon: typeof WalletCards;
  iconClassName: string;
  title: string;
  amount: number;
  helper: string;
  helperClassName: string;
  trend: string;
  trendDirection: 'up' | 'down';
  trendTone: 'good' | 'bad';
}) {
  const TrendIcon = trendDirection === 'up' ? ArrowUp : ArrowDown;

  return (
    <section className="glass-panel p-5">
      <div className="flex items-start gap-4">
        <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg ${iconClassName}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold leading-5 text-slate-950">{title}</h2>
          <p className="mt-6 text-3xl font-bold tracking-normal text-slate-950">
            {currency(amount)} <span className="text-sm font-bold">CHF</span>
          </p>
          <p className={`mt-2 text-sm font-bold ${helperClassName}`}>{helper}</p>
        </div>
      </div>
      <div className="mt-7 flex items-center justify-between text-sm">
        <span className="text-slate-600">vs last month</span>
        <span className={`flex items-center gap-1 font-bold ${trendTone === 'good' ? 'text-emerald-600' : 'text-red-500'}`}>
          <TrendIcon className="h-4 w-4" />
          {trend}
        </span>
      </div>
    </section>
  );
}

function ExpenseDonut({ categories, totalExpenses }: { categories: ExpenseCategory[]; totalExpenses: number }) {
  const gradientPrefix = useId().replaceAll(':', '');

  return (
    <div className="relative h-96 min-h-96">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {categories.map((category) => (
              <linearGradient
                key={category.id}
                id={`${gradientPrefix}-${category.id}`}
                x1="0"
                x2="1"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={category.color} stopOpacity={0.38} />
                <stop offset="100%" stopColor={category.color} stopOpacity={0.96} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={categories}
            dataKey="value"
            innerRadius="54%"
            isAnimationActive={false}
            nameKey="label"
            outerRadius="82%"
            paddingAngle={1}
            shape={(props, index) => (
              <ExpenseSector
                {...props}
                fill={`url(#${gradientPrefix}-${categories[index]?.id ?? 'fallback'})`}
              />
            )}
          />
          <Tooltip
            content={<ExpenseTooltip totalExpenses={totalExpenses} />}
            wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 50 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-center">
        <div>
          <p className="text-4xl font-bold text-slate-950">
            {currency(totalExpenses)} <span className="text-base">CHF</span>
          </p>
          <p className="mt-2 text-base text-slate-700">Monthly Expenses</p>
        </div>
      </div>
    </div>
  );
}

function ExpenseSector(props: PieSectorShapeProps & { fill: string }) {
  return <Sector {...props} stroke="rgba(255,255,255,.86)" strokeWidth={2} />;
}

function CategoryLegend({ categories }: { categories: ExpenseCategory[] }) {
  return (
    <div className="flex flex-col justify-center gap-4">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center gap-3 text-base text-slate-700">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
          <span>{category.label}</span>
        </div>
      ))}
    </div>
  );
}

function ExpenseBreakdownRow({
  category,
  percent,
  totalExpenses,
  onChange,
}: {
  category: ExpenseCategory;
  percent: number;
  totalExpenses: number;
  onChange: (id: string, value: number) => void;
}) {
  const barWidth = totalExpenses > 0 ? `${Math.max(3, percent)}%` : '0%';

  return (
    <div>
      <div className="grid grid-cols-[1fr_7.5rem_4rem] items-center gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="truncate text-slate-700">{category.label}</span>
        </div>
        <label className="glass-input h-8 justify-end px-2 py-1 text-right text-slate-950">
          <input
            aria-label={`${category.label} monthly expense`}
            className="w-full min-w-0 bg-transparent text-right outline-none"
            min={0}
            step={10}
            type="number"
            value={category.value}
            onChange={(event) => onChange(category.id, Number(event.currentTarget.value))}
          />
          <span className="text-sm font-semibold text-slate-600">CHF</span>
        </label>
        <span className="text-right text-slate-600">{percent.toFixed(1)}%</span>
      </div>
      <div className="mt-1 h-px bg-slate-300/60">
        <div className="h-px" style={{ width: barWidth, backgroundColor: category.color }} />
      </div>
    </div>
  );
}

function IncomeVsExpenses({
  monthlyIncome,
  totalExpenses,
  savingsPotential,
}: {
  monthlyIncome: number;
  totalExpenses: number;
  savingsPotential: number;
}) {
  const savingsRate = getPercent(savingsPotential, monthlyIncome);

  return (
    <section className="glass-panel flex h-full flex-col p-4">
      <h2 className="text-sm font-bold text-slate-950">Income vs Expenses</h2>
      <div className="mt-5 flex flex-1 flex-col justify-evenly gap-4">
        <ProgressRow color="bg-blue-500/75" label="Monthly Income" max={monthlyIncome} value={monthlyIncome} />
        <ProgressRow color="bg-rose-500/70" label="Total Expenses" max={monthlyIncome} value={totalExpenses} />
        <ProgressRow color="bg-emerald-500/70" label="Remaining" max={monthlyIncome} value={savingsPotential} />
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-lg border border-blue-200/70 bg-green-50/30 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/12 text-emerald-600">
          <ChartLine className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">Savings Rate</p>
          <p className="text-lg font-bold text-emerald-600">
            {savingsRate.toFixed(1)}% <span className="text-sm text-slate-950">of income</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function ProgressRow({ color, label, max, value }: { color: string; label: string; max: number; value: number }) {
  const width = max > 0 ? `${Math.min(100, (value / max) * 100)}%` : '0%';

  return (
    <div className="grid grid-cols-[1fr_5.5rem] items-center gap-3 text-sm">
      <div>
        <p className="text-slate-700">{label}</p>
        <div className="mt-2 h-1.5 rounded-full bg-slate-300/40">
          <div className={`h-1.5 rounded-full ${color}`} style={{ width }} />
        </div>
      </div>
      <p className="text-right font-bold text-slate-950">{currency(value)} CHF</p>
    </div>
  );
}

function TopCostDrivers({ drivers, totalExpenses }: { drivers: ExpenseCategory[]; totalExpenses: number }) {
  const rankColors = [
    'bg-blue-500/12 text-blue-600',
    'bg-emerald-500/12 text-emerald-600',
    'bg-amber-500/14 text-amber-600',
  ];

  return (
    <section className="glass-panel flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-950">Top 3 Cost Drivers</h2>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-5 flex flex-1 flex-col justify-evenly divide-y divide-slate-300/50">
        {drivers.map((category, index) => (
          <div key={category.id} className="grid grid-cols-[2.5rem_1fr_6rem_4rem] items-center gap-3 py-4 text-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-full ${rankColors[index]} text-sm font-bold`}>
              {index + 1}
            </span>
            <span className="truncate font-semibold text-slate-700">{category.label}</span>
            <span className="text-right font-bold text-slate-950">{currency(category.value)} CHF</span>
            <span className="text-right text-slate-600">{getPercent(category.value, totalExpenses).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExpenseInsights({
  categories,
  totalExpenses,
  savingsPotential,
  monthlyIncome,
}: {
  categories: ExpenseCategory[];
  totalExpenses: number;
  savingsPotential: number;
  monthlyIncome: number;
}) {
  const rent = categories.find(({ id }) => id === 'rent')?.value ?? 0;
  const food = categories.find(({ id }) => id === 'food')?.value ?? 0;
  const insurance = categories.find(({ id }) => id === 'insurance')?.value ?? 0;
  const subscriptions = categories.find(({ id }) => id === 'subscriptions')?.value ?? 0;

  return (
    <section className="glass-panel flex h-full flex-col p-4">
      <h2 className="text-sm font-bold text-slate-950">Insights</h2>
      <div className="mt-5 flex flex-1 flex-col justify-evenly gap-4 text-sm leading-5 text-slate-800">
        <InsightItem color="bg-violet-500/12 text-violet-600" icon={Home}>
          Rent represents {Math.round(getPercent(rent, totalExpenses))}% of your total monthly expenses.
        </InsightItem>
        <InsightItem color="bg-amber-500/12 text-amber-500" icon={Star}>
          Food spending exceeds insurance costs by {currency(Math.max(food - insurance, 0))} CHF.
        </InsightItem>
        <InsightItem color="bg-cyan-500/12 text-cyan-600" icon={WalletCards}>
          Reducing subscriptions by 50% could save you {currency(subscriptions / 2)} CHF per month.
        </InsightItem>
        <InsightItem color="bg-emerald-500/12 text-emerald-600" icon={PiggyBank}>
          Your current savings rate is {Math.round(getPercent(savingsPotential, monthlyIncome))}%, keep it up!
        </InsightItem>
      </div>
    </section>
  );
}

function InsightItem({ children, color, icon: Icon }: { children: ReactNode; color: string; icon: typeof Home }) {
  return (
    <div className="flex items-start gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${color}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p>{children}</p>
    </div>
  );
}

type ExpenseTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: ExpenseCategory; value?: number }>;
  totalExpenses: number;
};

function ExpenseTooltip({ active, payload, totalExpenses }: ExpenseTooltipProps) {
  const category = payload?.[0]?.payload;

  if (!active || !category) {
    return null;
  }

  return (
    <div className="rounded-lg border border-white/70 bg-white/90 px-3 py-2 text-xs shadow-xl shadow-slate-400/20 backdrop-blur-xl">
      <p className="font-bold text-slate-950">{category.label}</p>
      <p className="mt-1 text-slate-600">
        {currency(category.value)} CHF · {getPercent(category.value, totalExpenses).toFixed(1)}%
      </p>
    </div>
  );
}

function readSavedExpenses() {
  try {
    const savedValue = window.localStorage.getItem(EXPENSES_STORAGE_KEY);
    const savedCategories = savedValue ? JSON.parse(savedValue) : [];

    if (!Array.isArray(savedCategories)) {
      return defaultCategories;
    }

    return defaultCategories.map((category) => {
      const savedCategory = savedCategories.find((savedItem) => savedItem?.id === category.id);
      const savedValue = typeof savedCategory?.value === 'number' && Number.isFinite(savedCategory.value)
        ? savedCategory.value
        : category.value;

      return { ...category, value: savedValue };
    });
  } catch {
    return defaultCategories;
  }
}

function saveExpenses(categories: ExpenseCategory[]) {
  try {
    window.localStorage.setItem(
      EXPENSES_STORAGE_KEY,
      JSON.stringify(categories.map(({ id, value }) => ({ id, value }))),
    );
  } catch {
    // Ignore storage failures so editing remains available in restricted browser modes.
  }
}

function getPercent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

function formatPercent(value: number, total: number) {
  return `${getPercent(value, total).toFixed(1)}%`;
}
