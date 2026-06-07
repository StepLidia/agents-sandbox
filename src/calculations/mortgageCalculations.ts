export type MortgageAsset = {
  id: string;
  label: string;
  amount: number;
};

export type MortgageInputs = {
  propertyPrice: number;
  downPayment: number;
  grossAnnualIncome: number;
  annualInterestRate: number;
  maintenanceRate: number;
  repaymentYears: number;
  targetLoanToValueRatio: number;
  maxAffordabilityRatio: number;
  maxLoanToValueRatio: number;
  requiredDownPaymentRatio: number;
  availableAssets: MortgageAsset[];
};

export type MortgageOverview = {
  totalAvailableAssets: number;
  requiredDownPayment: number;
  downPayment: number;
  downPaymentRatio: number;
  mortgageAmount: number;
  loanToValueRatio: number;
  monthlyPayment: number;
  affordabilityRatio: number;
  maxAffordablePropertyPrice: number;
  canAffordProperty: boolean;
};

export type MortgageAmortizationStrategy = 'direct' | 'indirect';

export type MortgageRepaymentInputs = {
  mortgageAmount: number;
  propertyPrice: number;
  annualInterestRate: number;
  targetLoanToValueRatio: number;
  years: number;
  strategy: MortgageAmortizationStrategy;
};

export type MortgageRepaymentYear = {
  year: number;
  mortgageBalance: number;
  annualInterestCost: number;
  annualAmortization: number;
  pillar3Assets: number;
};

export type MortgageRepaymentProjection = {
  strategy: MortgageAmortizationStrategy;
  targetMortgageBalance: number;
  annualAmortization: number;
  totalInterestPaid: number;
  totalAmortization: number;
  monthlyPayment: number;
  endingMortgageBalance: number;
  endingPillar3Assets: number;
  schedule: MortgageRepaymentYear[];
};

export type MortgageCostItem = {
  label: string;
  amount: number;
};

export type MortgageCosts = {
  oneTimeCosts: MortgageCostItem[];
  ongoingAnnualCosts: MortgageCostItem[];
  totalOneTimeCosts: number;
  totalOngoingAnnualCosts: number;
  monthlyOngoingCosts: number;
};

export const MIN_HARD_EQUITY_RATIO = 10;
export const DEFAULT_REPAYMENT_YEARS = 20;
export const DEFAULT_TARGET_LOAN_TO_VALUE_RATIO = 65;
export const LAND_REGISTRY_FEE_RATE = 1.8;
export const PROPERTY_TAX_ESTIMATE_RATE = 0.15;
export const ESTIMATED_NOTARY_FEES = 2000;
export const ESTIMATED_MORTGAGE_REGISTRATION_FEES = 1000;
export const ESTIMATED_ADMINISTRATIVE_FEES = 500;
export const ESTIMATED_ONE_TIME_OTHER_COSTS = 1100;
export const ESTIMATED_BUILDING_INSURANCE = 600;
export const ESTIMATED_ANNUAL_OTHER_COSTS = 300;

const HARD_EQUITY_ASSET_IDS = ['cash', 'pillar3', 'securities'];

export const defaultMortgageInputs: MortgageInputs = {
  propertyPrice: 500000,
  downPayment: 160000,
  grossAnnualIncome: 120000,
  annualInterestRate: 5,
  maintenanceRate: 1,
  repaymentYears: DEFAULT_REPAYMENT_YEARS,
  targetLoanToValueRatio: DEFAULT_TARGET_LOAN_TO_VALUE_RATIO,
  maxAffordabilityRatio: 33,
  maxLoanToValueRatio: 80,
  requiredDownPaymentRatio: 20,
  availableAssets: [
    { id: 'pillar2', label: '2nd Pillar (BVG)', amount: 85000 },
    { id: 'pillar3', label: '3rd Pillar (a)', amount: 15000 },
    { id: 'cash', label: 'Cash & Savings', amount: 25000 },
    { id: 'securities', label: 'Securities / Investments', amount: 40000 },
  ],
};

export function calculateMortgageOverview(inputs: MortgageInputs): MortgageOverview {
  const propertyPrice = normalizeMoney(inputs.propertyPrice);
  const totalAvailableAssets = getTotalAvailableAssets(inputs.availableAssets);
  const requiredDownPayment = calculateDownPayment(propertyPrice, inputs.requiredDownPaymentRatio);
  const downPayment = Math.min(normalizeMoney(inputs.downPayment), propertyPrice);
  const mortgageAmount = calculateMortgageAmount(propertyPrice, downPayment);
  const loanToValueRatio = calculateLoanToValueRatio(mortgageAmount, propertyPrice);
  const annualAmortization = calculateRequiredAnnualAmortization({
    mortgageAmount,
    propertyPrice,
    targetLoanToValueRatio: inputs.targetLoanToValueRatio,
    years: inputs.repaymentYears,
  });
  const monthlyPayment = calculateMonthlyHousingPayment({
    annualAmortization,
    annualInterestRate: inputs.annualInterestRate,
    maintenanceRate: inputs.maintenanceRate,
    mortgageAmount,
    propertyPrice,
  });
  const affordabilityRatio = calculateAffordabilityRatio(monthlyPayment, inputs.grossAnnualIncome);
  const maxAffordablePropertyPrice = calculateMaxAffordablePropertyPrice(inputs);
  const hardEquityRatio = calculateHardEquityRatio(inputs.availableAssets, propertyPrice);

  return {
    totalAvailableAssets,
    requiredDownPayment,
    downPayment,
    downPaymentRatio: calculateDownPaymentRatio(downPayment, propertyPrice),
    mortgageAmount,
    loanToValueRatio,
    monthlyPayment,
    affordabilityRatio,
    maxAffordablePropertyPrice,
    canAffordProperty:
      downPayment >= requiredDownPayment &&
      totalAvailableAssets >= downPayment &&
      hardEquityRatio >= MIN_HARD_EQUITY_RATIO &&
      affordabilityRatio <= inputs.maxAffordabilityRatio &&
      loanToValueRatio <= inputs.maxLoanToValueRatio,
  };
}

export function getTotalAvailableAssets(assets: MortgageAsset[]) {
  return assets.reduce((sum, asset) => sum + normalizeMoney(asset.amount), 0);
}

export function calculateDownPayment(propertyPrice: number, requiredDownPaymentRatio: number) {
  return normalizeMoney(propertyPrice) * normalizeRatio(requiredDownPaymentRatio);
}

export function calculateDownPaymentRatio(downPayment: number, propertyPrice: number) {
  return calculateRatio(downPayment, propertyPrice);
}

export function calculateMortgageAmount(propertyPrice: number, downPayment: number) {
  return Math.max(normalizeMoney(propertyPrice) - normalizeMoney(downPayment), 0);
}

export function calculateLoanToValueRatio(mortgageAmount: number, propertyPrice: number) {
  return calculateRatio(mortgageAmount, propertyPrice);
}

export function calculateHardEquityRatio(assets: MortgageAsset[], propertyPrice: number) {
  return calculateRatio(getHardEquity(assets), propertyPrice);
}

export function calculateMonthlyHousingPayment({
  annualAmortization,
  annualInterestRate,
  maintenanceRate,
  mortgageAmount,
  propertyPrice,
}: {
  annualAmortization: number;
  annualInterestRate: number;
  maintenanceRate: number;
  mortgageAmount: number;
  propertyPrice: number;
}) {
  const annualInterest = normalizeMoney(mortgageAmount) * normalizeRatio(annualInterestRate);
  const annualMaintenance = normalizeMoney(propertyPrice) * normalizeRatio(maintenanceRate);

  return (annualInterest + annualMaintenance + normalizeMoney(annualAmortization)) / 12;
}

export function calculateRequiredAnnualAmortization({
  mortgageAmount,
  propertyPrice,
  targetLoanToValueRatio,
  years,
}: {
  mortgageAmount: number;
  propertyPrice: number;
  targetLoanToValueRatio: number;
  years: number;
}) {
  const normalizedYears = normalizeYears(years);

  if (normalizedYears === 0) {
    return 0;
  }

  const targetMortgageBalance = Math.min(
    normalizeMoney(mortgageAmount),
    normalizeMoney(propertyPrice) * normalizeRatio(targetLoanToValueRatio),
  );

  return Math.max(normalizeMoney(mortgageAmount) - targetMortgageBalance, 0) / normalizedYears;
}

export function calculateRequiredAnnualAmortizationRate({
  mortgageAmount,
  propertyPrice,
  targetLoanToValueRatio,
  years,
}: {
  mortgageAmount: number;
  propertyPrice: number;
  targetLoanToValueRatio: number;
  years: number;
}) {
  const normalizedMortgageAmount = normalizeMoney(mortgageAmount);

  return normalizedMortgageAmount === 0
    ? 0
    : calculateRatio(
      calculateRequiredAnnualAmortization({
        mortgageAmount,
        propertyPrice,
        targetLoanToValueRatio,
        years,
      }),
      normalizedMortgageAmount,
    );
}

export function calculateMortgageCosts({
  maintenanceRate,
  propertyPrice,
}: {
  maintenanceRate: number;
  propertyPrice: number;
}): MortgageCosts {
  const normalizedPropertyPrice = normalizeMoney(propertyPrice);
  const oneTimeCosts = [
    {
      label: `Land Registry Fee (${LAND_REGISTRY_FEE_RATE.toFixed(1)}%)`,
      amount: calculatePercentageCost(normalizedPropertyPrice, LAND_REGISTRY_FEE_RATE),
    },
    { label: 'Notary Fees', amount: ESTIMATED_NOTARY_FEES },
    { label: 'Mortgage Registration', amount: ESTIMATED_MORTGAGE_REGISTRATION_FEES },
    { label: 'Administrative Fees', amount: ESTIMATED_ADMINISTRATIVE_FEES },
    { label: 'Other Costs', amount: ESTIMATED_ONE_TIME_OTHER_COSTS },
  ];
  const ongoingAnnualCosts = [
    {
      label: `Maintenance (${maintenanceRate.toFixed(1)}%)`,
      amount: calculatePercentageCost(normalizedPropertyPrice, maintenanceRate),
    },
    {
      label: 'Property Tax (Est.)',
      amount: calculatePercentageCost(normalizedPropertyPrice, PROPERTY_TAX_ESTIMATE_RATE),
    },
    { label: 'Building Insurance (Est.)', amount: ESTIMATED_BUILDING_INSURANCE },
    { label: 'Other Costs', amount: ESTIMATED_ANNUAL_OTHER_COSTS },
  ];
  const totalOneTimeCosts = sumMortgageCostItems(oneTimeCosts);
  const totalOngoingAnnualCosts = sumMortgageCostItems(ongoingAnnualCosts);

  return {
    oneTimeCosts,
    ongoingAnnualCosts,
    totalOneTimeCosts,
    totalOngoingAnnualCosts,
    monthlyOngoingCosts: totalOngoingAnnualCosts / 12,
  };
}

export function calculateMortgageRepaymentProjection({
  annualInterestRate,
  mortgageAmount,
  propertyPrice,
  strategy,
  targetLoanToValueRatio,
  years,
}: MortgageRepaymentInputs): MortgageRepaymentProjection {
  const normalizedYears = normalizeYears(years);
  const startingBalance = normalizeMoney(mortgageAmount);
  const targetMortgageBalance = Math.min(
    startingBalance,
    normalizeMoney(propertyPrice) * normalizeRatio(targetLoanToValueRatio),
  );
  const totalAmortization = Math.max(startingBalance - targetMortgageBalance, 0);
  const annualAmortization = normalizedYears > 0 ? totalAmortization / normalizedYears : 0;
  const schedule = Array.from({ length: normalizedYears + 1 }, (_, year) =>
    calculateMortgageRepaymentYear({
      annualAmortization,
      annualInterestRate,
      startingBalance,
      strategy,
      targetMortgageBalance,
      year,
    }),
  );
  const totalInterestPaid = schedule
    .slice(0, -1)
    .reduce((total, year) => total + year.annualInterestCost, 0);
  const firstPaymentYear = schedule[0] ?? {
    annualAmortization: 0,
    annualInterestCost: 0,
  };
  const lastYear = schedule.at(-1) ?? {
    mortgageBalance: startingBalance,
    pillar3Assets: 0,
  };

  return {
    strategy,
    targetMortgageBalance,
    annualAmortization,
    totalInterestPaid,
    totalAmortization,
    monthlyPayment: (firstPaymentYear.annualInterestCost + firstPaymentYear.annualAmortization) / 12,
    endingMortgageBalance: lastYear.mortgageBalance,
    endingPillar3Assets: lastYear.pillar3Assets,
    schedule,
  };
}

export function buildMortgageChartTicks(values: number[]) {
  const maxValue = Math.max(...values.map(normalizeMoney), 0);

  if (maxValue === 0) {
    return [0, 1000, 2000, 3000, 4000];
  }

  const step = calculateNiceThousandsStep(maxValue / 4);
  const maxTick = Math.ceil(maxValue / step) * step;

  return Array.from({ length: Math.floor(maxTick / step) + 1 }, (_, index) => index * step);
}

function calculateMortgageRepaymentYear({
  annualAmortization,
  annualInterestRate,
  startingBalance,
  strategy,
  targetMortgageBalance,
  year,
}: {
  annualAmortization: number;
  annualInterestRate: number;
  startingBalance: number;
  strategy: MortgageAmortizationStrategy;
  targetMortgageBalance: number;
  year: number;
}): MortgageRepaymentYear {
  const directBalance = Math.max(startingBalance - annualAmortization * year, targetMortgageBalance);
  const mortgageBalance = strategy === 'direct' ? directBalance : startingBalance;
  const pillar3Assets = strategy === 'indirect' ? annualAmortization * year : 0;

  return {
    year,
    mortgageBalance,
    annualInterestCost: mortgageBalance * normalizeRatio(annualInterestRate),
    annualAmortization: year < 1 ? annualAmortization : 0,
    pillar3Assets,
  };
}

export function calculateAffordabilityRatio(monthlyPayment: number, grossAnnualIncome: number) {
  return calculateRatio(normalizeMoney(monthlyPayment) * 12, grossAnnualIncome);
}

export function calculateGrossAnnualIncome(grossMonthlyIncome: number) {
  return normalizeMoney(grossMonthlyIncome) * 12;
}

export function calculateMaxAffordablePropertyPrice(inputs: MortgageInputs) {
  const downPayment = normalizeMoney(inputs.downPayment);
  const requiredDownPaymentRatio = normalizeRatio(inputs.requiredDownPaymentRatio);
  const ltvDownPaymentRatio = normalizeRatio(100 - inputs.maxLoanToValueRatio);
  const minDownPaymentRatio = Math.max(requiredDownPaymentRatio, ltvDownPaymentRatio);
  const downPaymentLimitedPrice = minDownPaymentRatio > 0 ? downPayment / minDownPaymentRatio : 0;
  const hardEquityRatio = normalizeRatio(MIN_HARD_EQUITY_RATIO);
  const hardEquityLimitedPrice = hardEquityRatio > 0 ? getHardEquity(inputs.availableAssets) / hardEquityRatio : 0;
  const assetLimitedPrice = Math.min(downPaymentLimitedPrice, hardEquityLimitedPrice);
  const incomeLimitedPrice = calculateMaxAffordablePropertyPriceByIncome(inputs, assetLimitedPrice);

  return Math.min(incomeLimitedPrice, downPaymentLimitedPrice, hardEquityLimitedPrice);
}

function calculateMaxAffordablePropertyPriceByIncome(inputs: MortgageInputs, maxPropertyPrice: number) {
  const normalizedMaxPropertyPrice = normalizeMoney(maxPropertyPrice);

  if (normalizedMaxPropertyPrice === 0) {
    return 0;
  }

  const annualHousingBudget = normalizeMoney(inputs.grossAnnualIncome) * normalizeRatio(inputs.maxAffordabilityRatio);
  let low = 0;
  let high = normalizedMaxPropertyPrice;

  for (let iteration = 0; iteration < 60; iteration += 1) {
    const propertyPrice = (low + high) / 2;
    const mortgageAmount = calculateMortgageAmount(propertyPrice, inputs.downPayment);
    const monthlyPayment = calculateMonthlyHousingPayment({
      annualAmortization: calculateRequiredAnnualAmortization({
        mortgageAmount,
        propertyPrice,
        targetLoanToValueRatio: inputs.targetLoanToValueRatio,
        years: inputs.repaymentYears,
      }),
      annualInterestRate: inputs.annualInterestRate,
      maintenanceRate: inputs.maintenanceRate,
      mortgageAmount,
      propertyPrice,
    });

    if (monthlyPayment * 12 <= annualHousingBudget) {
      low = propertyPrice;
    } else {
      high = propertyPrice;
    }
  }

  return low;
}

export function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 100);
}

function calculateRatio(value: number, total: number) {
  const normalizedTotal = normalizeMoney(total);

  return normalizedTotal === 0 ? 0 : (normalizeMoney(value) / normalizedTotal) * 100;
}

function normalizeRatio(value: number) {
  return Math.max(value, 0) / 100;
}

function normalizeMoney(value: number) {
  return Number.isFinite(value) ? Math.max(value, 0) : 0;
}

function normalizeYears(value: number) {
  return Number.isFinite(value) ? Math.max(Math.round(value), 0) : 0;
}

function calculateNiceThousandsStep(value: number) {
  const normalizedValue = Math.max(value, 1000);
  const magnitude = 10 ** Math.floor(Math.log10(normalizedValue));
  const normalizedStep = normalizedValue / magnitude;
  const multiplier = normalizedStep <= 1 ? 1 : normalizedStep <= 2 ? 2 : normalizedStep <= 5 ? 5 : 10;

  return multiplier * magnitude;
}

function calculatePercentageCost(amount: number, rate: number) {
  return Math.round(normalizeMoney(amount) * normalizeRatio(rate));
}

function sumMortgageCostItems(items: MortgageCostItem[]) {
  return items.reduce((total, item) => total + normalizeMoney(item.amount), 0);
}

function getHardEquity(assets: MortgageAsset[]) {
  return assets
    .filter((asset) => HARD_EQUITY_ASSET_IDS.includes(asset.id))
    .reduce((total, asset) => total + normalizeMoney(asset.amount), 0);
}
