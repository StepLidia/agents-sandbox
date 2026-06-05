import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Plus,
  Trash2,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  ChartLine,
  ChevronLeft,
  ChevronRight,
  Home,
  PiggyBank,
  Star,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Pie, PieChart, ResponsiveContainer, Sector, Tooltip, type PieSectorShapeProps } from 'recharts';
import { currency } from '../finance';
import { useEditableNumber } from '../hooks/useEditableNumber';
import { InsightValue } from './InsightValue';

const EXPENSES_STORAGE_KEY = 'growly-expenses-v1';
const DEFAULT_MONTHLY_INCOME = 6000;

type ExpenseCategory = {
  id: string;
  label: string;
  value: number;
  color: string;
  kind: 'essential' | 'lifestyle';
};

type ExpenseMonth = {
  key: string;
  label: string;
  shortLabel: string;
};

type SavedExpensesByMonth = {
  months: Record<string, ExpenseCategory[]>;
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
  const [expenseMonth, setExpenseMonth] = useState(getCurrentExpenseMonth);
  const shouldSkipNextSave = useRef(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => readSavedExpenses(expenseMonth.key));
  const [draftCategory, setDraftCategory] = useState<{ name: string; value: number } | null>(null);
  const totalExpenses = useMemo(() => categories.reduce((sum, category) => sum + category.value, 0), [categories]);
  const essentialExpenses = useMemo(
    () => categories.filter(({ kind }) => kind === 'essential').reduce((sum, category) => sum + category.value, 0),
    [categories],
  );
  const lifestyleExpenses = totalExpenses - essentialExpenses;
  const savingsPotential = Math.max(monthlyIncome - totalExpenses, 0);
  const topDrivers = [...categories].sort((first, second) => second.value - first.value).slice(0, 3);

  useEffect(() => {
    if (shouldSkipNextSave.current) {
      shouldSkipNextSave.current = false;
      return;
    }

    saveExpenses(expenseMonth.key, categories);
  }, [categories, expenseMonth.key]);

  function updateCategory(id: string, value: number) {
    setCategories((currentCategories) =>
      currentCategories.map((category) => (category.id === id ? { ...category, value: Math.max(0, value) } : category)),
    );
  }

  function deleteCategory(id: string) {
    setCategories((currentCategories) => currentCategories.filter((category) => category.id !== id));
  }

  function resetCurrentMonth() {
    deleteSavedExpensesMonth(expenseMonth.key);
    shouldSkipNextSave.current = true;
    setDraftCategory(null);
    setCategories(defaultCategories);
  }

  function selectExpenseMonth(nextMonth: ExpenseMonth) {
    setExpenseMonth(nextMonth);
    setDraftCategory(null);
    setCategories(readSavedExpenses(nextMonth.key));
  }

  function addCategory() {
    setDraftCategory({ name: '', value: 0 });
  }

  function saveDraftCategory() {
    if (!draftCategory) {
      return;
    }

    const label = draftCategory.name.trim();

    if (!label) {
      return;
    }

    setCategories((currentCategories) => [
      ...currentCategories,
      {
        id: buildCategoryId(label),
        label,
        value: Math.max(0, draftCategory.value),
        color: getRandomCategoryColor(),
        kind: 'lifestyle',
      },
    ]);
    setDraftCategory(null);
  }

  return (
    <>
      <ExpensesHeader expenseMonth={expenseMonth} onMonthChange={selectExpenseMonth} onResetMonth={resetCurrentMonth} />
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
        <section className="glass-panel flex min-h-0 flex-col p-4 md:max-h-100">
          <h2 className="text-sm font-bold text-slate-950">Monthly Expense Distribution</h2>
          <div className="mt-3 grid flex-1 place-content-center items-center gap-4 grid-cols-[minmax(9rem,14rem)_minmax(8rem,1fr)] sm:grid-cols-[minmax(12rem,18rem)_minmax(10rem,1fr)] md:grid-cols-[minmax(16rem,20rem)_minmax(9rem,20rem)] md:gap-10">
            <ExpenseDonut categories={categories} totalExpenses={totalExpenses} />
            <CategoryLegend categories={categories} />
          </div>
        </section>

        <section className="glass-panel flex min-h-0 flex-col p-4 md:max-h-100">
          <h2 className="text-sm font-bold text-slate-950">Category Breakdown</h2>
          <div className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-2">
            {categories.map((category) => (
              <ExpenseBreakdownRow
                key={category.id}
                category={category}
                percent={getPercent(category.value, totalExpenses)}
                totalExpenses={totalExpenses}
                onChange={updateCategory}
                onDelete={deleteCategory}
              />
            ))}
          </div>
          <AddCategoryRow
            draftCategory={draftCategory}
            onAdd={addCategory}
            onNameChange={(name) => setDraftCategory((draft) => (draft ? { ...draft, name } : draft))}
            onSave={saveDraftCategory}
            onValueChange={(value) => setDraftCategory((draft) => (draft ? { ...draft, value } : draft))}
          />
          <div className="mt-3 flex items-center justify-between pt-3 text-sm font-bold">
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

function ExpensesHeader({
  expenseMonth,
  onMonthChange,
  onResetMonth,
}: {
  expenseMonth: ExpenseMonth;
  onMonthChange: (month: ExpenseMonth) => void;
  onResetMonth: () => void;
}) {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Expenses</h1>
        <p className="mt-1 text-sm text-slate-700">Track your spending. Understand your habits. Take control.</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            className="glass-control export-button font-semibold"
            aria-controls="expenses-month-picker"
            aria-expanded={isMonthPickerOpen}
            type="button"
            onClick={() => setIsMonthPickerOpen((isOpen) => !isOpen)}
          >
            <CalendarDays className="h-4 w-4" />
            {expenseMonth.label}
            <ChevronDown className={`h-4 w-4 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} />
          </button>
          {isMonthPickerOpen && (
            <MonthPicker
              expenseMonth={expenseMonth}
              onMonthChange={(month) => {
                onMonthChange(month);
                setIsMonthPickerOpen(false);
              }}
            />
          )}
        </div>
        <button className="glass-icon h-10 w-10" aria-label="View expense trend" type="button">
          <ChartLine className="h-4 w-4" />
        </button>
        <span className="group relative">
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-white/35 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,.78),0_10px_28px_rgba(80,99,130,.12)] transition hover:bg-red-500/10 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            aria-label={`Reset ${expenseMonth.label} expenses`}
            aria-describedby="delete-month-data-tooltip"
            type="button"
            onClick={onResetMonth}
          >
            <Trash2 className="h-4 w-4 text-current" />
          </button>
          <span
            id="delete-month-data-tooltip"
            role="tooltip"
            className="pointer-events-none absolute right-0 top-12 z-50 w-max whitespace-nowrap rounded-lg border border-white/60 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 opacity-0 shadow-xl shadow-slate-400/20 backdrop-blur-xl transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          >
            Delete selected month data
          </span>
        </span>
      </div>
    </header>
  );
}

function MonthPicker({
  expenseMonth,
  onMonthChange,
}: {
  expenseMonth: ExpenseMonth;
  onMonthChange: (month: ExpenseMonth) => void;
}) {
  const [visibleYear, setVisibleYear] = useState(() => Number(expenseMonth.key.slice(0, 4)));
  const selectedMonth = Number(expenseMonth.key.slice(5, 7));
  const months = Array.from({ length: 12 }, (_, index) => buildExpenseMonth(visibleYear, index));

  return (
    <div
      id="expenses-month-picker"
      className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-white/60 bg-white/95 p-3 shadow-xl shadow-slate-400/20 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-700"
          aria-label="Previous year"
          type="button"
          onClick={() => setVisibleYear((year) => year - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-bold text-slate-950">{visibleYear}</p>
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 transition hover:bg-blue-500/10 hover:text-blue-700"
          aria-label="Next year"
          type="button"
          onClick={() => setVisibleYear((year) => year + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {months.map((month) => {
          const isSelected = visibleYear === Number(expenseMonth.key.slice(0, 4)) && selectedMonth === Number(month.key.slice(5, 7));

          return (
            <button
              key={month.key}
              className={`h-9 rounded-lg text-sm font-semibold transition ${isSelected
                ? 'bg-blue-600/14 text-blue-700 shadow-inner'
                : 'text-slate-700 hover:bg-blue-500/10 hover:text-blue-700'
                }`}
              type="button"
              onClick={() => onMonthChange(month)}
            >
              {month.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
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
    <div className="relative h-44 min-h-44 sm:h-56 sm:min-h-56 md:h-72 md:min-h-72">
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
            isAnimationActive={false}
            content={<ExpenseTooltip totalExpenses={totalExpenses} />}
            wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 50 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center text-center">
        <div>
          <p className="text-sm font-bold text-slate-950 sm:text-3xl">
            {currency(totalExpenses)} <span className="text-xs sm:text-sm">CHF</span>
          </p>
          <p className="mt-1.5 text-xs text-slate-700 sm:mt-2 sm:text-sm">Monthly Expenses</p>
        </div>
      </div>
    </div>
  );
}

function ExpenseSector(props: PieSectorShapeProps & { fill: string }) {
  return <Sector {...props} stroke="rgba(255,255,255,.86)" strokeWidth={2} />;
}

function CategoryLegend({ categories }: { categories: ExpenseCategory[] }) {
  const columns = chunkCategories(categories, 9);

  return (
    <div className="grid grid-flow-col auto-cols-max items-start justify-center gap-x-5 gap-y-2.5">
      {columns.map((columnCategories, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-2.5">
          {columnCategories.map((category) => (
            <div key={category.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 sm:gap-3 sm:text-sm">
              <span className="h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5" style={{ backgroundColor: category.color }} />
              <span className="whitespace-nowrap">{category.label}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function chunkCategories(categories: ExpenseCategory[], maxPerColumn: number) {
  return Array.from(
    { length: Math.ceil(categories.length / maxPerColumn) },
    (_, index) => categories.slice(index * maxPerColumn, (index + 1) * maxPerColumn),
  );
}

function ExpenseBreakdownRow({
  category,
  percent,
  totalExpenses,
  onChange,
  onDelete,
}: {
  category: ExpenseCategory;
  percent: number;
  totalExpenses: number;
  onChange: (id: string, value: number) => void;
  onDelete: (id: string) => void;
}) {
  const barWidth = totalExpenses > 0 ? `${Math.max(3, percent)}%` : '0%';
  const { inputValue, onInputChange } = useEditableNumber(category.value, (value) => onChange(category.id, value));

  return (
    <div className="group">
      <div className="grid grid-cols-[1fr_7.5rem_4rem] items-center gap-3 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="truncate font-medium text-slate-700">{category.label}</span>
          <button
            aria-label={`Delete ${category.label}`}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 opacity-0 transition hover:bg-red-500/10 hover:text-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 group-hover:opacity-100 group-focus-within:opacity-100"
            type="button"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <label className="glass-input h-8 justify-end px-2 py-1 text-right text-slate-950">
          <input
            aria-label={`${category.label} monthly expense`}
            className="w-full min-w-0 bg-transparent text-right outline-none"
            min={0}
            step={10}
            type="number"
            value={inputValue}
            onChange={(event) => onInputChange(event.currentTarget.value)}
          />
          <span className="text-sm text-slate-600">CHF</span>
        </label>
        <span className="text-right font-semibold text-slate-600">{percent.toFixed(1)}%</span>
      </div>
      <div className="mt-0.5 h-px bg-slate-300/60">
        <div className="h-px" style={{ width: barWidth, backgroundColor: category.color }} />
      </div>
    </div>
  );
}

function AddCategoryRow({
  draftCategory,
  onAdd,
  onNameChange,
  onSave,
  onValueChange,
}: {
  draftCategory: { name: string; value: number } | null;
  onAdd: () => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onValueChange: (value: number) => void;
}) {
  const { inputValue, onInputChange } = useEditableNumber(draftCategory?.value ?? 0, onValueChange);

  if (!draftCategory) {
    return (
      <button
        className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-white/60 bg-white/35 text-sm font-bold text-slate-500 transition hover:bg-white/55"
        type="button"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" />
        Add Category
      </button>
    );
  }

  return (
    <div className="mt-3 grid grid-cols-[1fr_7.5rem_4rem] items-center gap-3 text-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
        <input
          autoFocus
          aria-label="New category name"
          className="glass-input h-8 w-full min-w-0 bg-transparent px-2 py-1 text-slate-950 outline-none"
          placeholder="Category name"
          type="text"
          value={draftCategory.name}
          onChange={(event) => onNameChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSave();
            }
          }}
        />
      </div>
      <label className="glass-input h-8 justify-end px-2 py-1 text-right text-slate-950">
        <input
          aria-label="New category monthly expense"
          className="w-full min-w-0 bg-transparent text-right outline-none"
          min={0}
          step={10}
          type="number"
          value={inputValue}
          onChange={(event) => onInputChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSave();
            }
          }}
        />
        <span className="text-sm text-slate-600">CHF</span>
      </label>
      <span className="text-right font-semibold text-slate-500">New</span>
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
      </div>
      <div className="mt-5 flex flex-1 flex-col justify-evenly divide-y divide-slate-300/50">
        {drivers.map((category, index) => (
          <div key={category.id} className="grid grid-cols-[2.5rem_1fr_6rem_4rem] items-center gap-3 py-4 text-sm">
            <span className={`grid h-10 w-10 place-items-center rounded-full ${rankColors[index]} text-sm font-bold`}>
              {index + 1}
            </span>
            <span className="truncate font-semibold text-slate-700">{category.label}</span>
            <span className="text-right font-bold text-slate-950">{currency(category.value)} CHF</span>
            <span className="text-right font-semibold text-slate-600">{getPercent(category.value, totalExpenses).toFixed(1)}%</span>
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
          Rent represents <InsightValue>{Math.round(getPercent(rent, totalExpenses))}%</InsightValue> of your total monthly expenses.
        </InsightItem>
        <InsightItem color="bg-amber-500/12 text-amber-500" icon={Star}>
          Food spending exceeds insurance costs by <InsightValue>{currency(Math.max(food - insurance, 0))} CHF</InsightValue>.
        </InsightItem>
        <InsightItem color="bg-cyan-500/12 text-cyan-600" icon={WalletCards}>
          Reducing subscriptions by <InsightValue>50%</InsightValue> could save you <InsightValue>{currency(subscriptions / 2)} CHF</InsightValue> per month.
        </InsightItem>
        <InsightItem color="bg-emerald-500/12 text-emerald-600" icon={PiggyBank}>
          Your current savings rate is <InsightValue>{Math.round(getPercent(savingsPotential, monthlyIncome))}%</InsightValue>, keep it up!
        </InsightItem>
      </div>
    </section>
  );
}

function InsightItem({ children, color, icon: Icon }: { children: ReactNode; color: string; icon: typeof Home }) {
  return (
    <div className="flex items-center gap-3">
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
        {currency(category.value)} CHF - {getPercent(category.value, totalExpenses).toFixed(1)}%
      </p>
    </div>
  );
}

function readSavedExpenses(monthKey: string) {
  try {
    const savedValue = window.localStorage.getItem(EXPENSES_STORAGE_KEY);
    const savedExpenses = savedValue ? JSON.parse(savedValue) : undefined;
    const savedCategories = getSavedCategoriesForMonth(savedExpenses, monthKey);

    if (!savedCategories) {
      return defaultCategories;
    }

    return mergeSavedExpenseCategories(savedCategories);
  } catch {
    return defaultCategories;
  }
}

function mergeSavedExpenseCategories(savedCategories: unknown[]) {
  try {
    const defaultCategoryIds = new Set(defaultCategories.map(({ id }) => id));
    const mergedDefaultCategories = defaultCategories.map((category) => {
      const savedCategory = savedCategories.find(
        (savedItem): savedItem is Pick<ExpenseCategory, 'id' | 'value'> =>
          isSavedExpenseValue(savedItem) && savedItem.id === category.id,
      );
      const savedValue = savedCategory?.value ?? category.value;

      return { ...category, value: savedValue };
    });
    const savedCustomCategories = savedCategories
      .filter((savedItem): savedItem is ExpenseCategory => isSavedExpenseCategory(savedItem) && !defaultCategoryIds.has(savedItem.id))
      .map((category) => ({ ...category, value: Math.max(0, category.value) }));

    return [...mergedDefaultCategories, ...savedCustomCategories];
  } catch {
    return defaultCategories;
  }
}

function saveExpenses(monthKey: string, categories: ExpenseCategory[]) {
  try {
    const savedValue = window.localStorage.getItem(EXPENSES_STORAGE_KEY);
    const savedExpenses = savedValue ? JSON.parse(savedValue) : undefined;
    const expensesByMonth = normalizeSavedExpenses(savedExpenses, monthKey);

    expensesByMonth.months[monthKey] = categories;
    window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expensesByMonth));
  } catch {
    // Ignore storage failures so editing remains available in restricted browser modes.
  }
}

function deleteSavedExpensesMonth(monthKey: string) {
  try {
    const savedValue = window.localStorage.getItem(EXPENSES_STORAGE_KEY);
    const savedExpenses = savedValue ? JSON.parse(savedValue) : undefined;
    const expensesByMonth = normalizeSavedExpenses(savedExpenses, monthKey);

    delete expensesByMonth.months[monthKey];
    window.localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expensesByMonth));
  } catch {
    // Ignore storage failures; the visible page state still resets to defaults.
  }
}

function getSavedCategoriesForMonth(savedExpenses: unknown, monthKey: string) {
  if (Array.isArray(savedExpenses)) {
    return savedExpenses;
  }

  if (isSavedExpensesByMonth(savedExpenses)) {
    return savedExpenses.months[monthKey];
  }

  return undefined;
}

function normalizeSavedExpenses(savedExpenses: unknown, monthKey: string): SavedExpensesByMonth {
  if (isSavedExpensesByMonth(savedExpenses)) {
    return savedExpenses;
  }

  if (Array.isArray(savedExpenses)) {
    return {
      months: {
        [monthKey]: mergeSavedExpenseCategories(savedExpenses),
      },
    };
  }

  return { months: {} };
}

function isSavedExpensesByMonth(value: unknown): value is SavedExpensesByMonth {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const savedExpenses = value as Partial<SavedExpensesByMonth>;

  return Boolean(savedExpenses.months) && typeof savedExpenses.months === 'object' && !Array.isArray(savedExpenses.months);
}

function isSavedExpenseCategory(value: unknown): value is ExpenseCategory {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const category = value as Partial<ExpenseCategory>;

  return (
    typeof category.id === 'string' &&
    typeof category.label === 'string' &&
    typeof category.value === 'number' &&
    Number.isFinite(category.value) &&
    typeof category.color === 'string' &&
    (category.kind === 'essential' || category.kind === 'lifestyle')
  );
}

function isSavedExpenseValue(value: unknown): value is Pick<ExpenseCategory, 'id' | 'value'> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const category = value as Partial<ExpenseCategory>;

  return typeof category.id === 'string' && typeof category.value === 'number' && Number.isFinite(category.value);
}

function buildCategoryId(label: string) {
  const normalizedLabel = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `${normalizedLabel || 'category'}-${Date.now()}`;
}

function getCurrentExpenseMonth(): ExpenseMonth {
  const currentDate = new Date();

  return buildExpenseMonth(currentDate.getFullYear(), currentDate.getMonth());
}

function buildExpenseMonth(year: number, monthIndex: number): ExpenseMonth {
  const date = new Date(year, monthIndex, 1);

  return {
    key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    label: date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    }),
    shortLabel: date.toLocaleDateString('en-US', {
      month: 'short',
    }),
  };
}

function getRandomCategoryColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 62 + Math.floor(Math.random() * 16);
  const lightness = 48 + Math.floor(Math.random() * 10);

  return hslToHex(hue, saturation, lightness);
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const normalizedSaturation = saturation / 100;
  const normalizedLightness = lightness / 100;
  const chroma = (1 - Math.abs(2 * normalizedLightness - 1)) * normalizedSaturation;
  const secondLargestComponent = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const lightnessAdjustment = normalizedLightness - chroma / 2;
  const [red, green, blue] =
    hue < 60
      ? [chroma, secondLargestComponent, 0]
      : hue < 120
        ? [secondLargestComponent, chroma, 0]
        : hue < 180
          ? [0, chroma, secondLargestComponent]
          : hue < 240
            ? [0, secondLargestComponent, chroma]
            : hue < 300
              ? [secondLargestComponent, 0, chroma]
              : [chroma, 0, secondLargestComponent];

  return `#${[red, green, blue]
    .map((color) => Math.round((color + lightnessAdjustment) * 255).toString(16).padStart(2, '0'))
    .join('')}`;
}

function getPercent(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

function formatPercent(value: number, total: number) {
  return `${getPercent(value, total).toFixed(1)}%`;
}
