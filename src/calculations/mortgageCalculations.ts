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
  amortizationRate: number;
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

export const MIN_HARD_EQUITY_RATIO = 10;

const HARD_EQUITY_ASSET_IDS = ['cash', 'pillar3', 'securities'];

export const defaultMortgageInputs: MortgageInputs = {
  propertyPrice: 500000,
  downPayment: 160000,
  grossAnnualIncome: 120000,
  annualInterestRate: 5,
  maintenanceRate: 1,
  amortizationRate: 1.10125,
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
  const monthlyPayment = calculateMonthlyHousingPayment({
    amortizationRate: inputs.amortizationRate,
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
  amortizationRate,
  annualInterestRate,
  maintenanceRate,
  mortgageAmount,
  propertyPrice,
}: {
  amortizationRate: number;
  annualInterestRate: number;
  maintenanceRate: number;
  mortgageAmount: number;
  propertyPrice: number;
}) {
  const annualInterest = normalizeMoney(mortgageAmount) * normalizeRatio(annualInterestRate);
  const annualMaintenance = normalizeMoney(propertyPrice) * normalizeRatio(maintenanceRate);
  const annualAmortization = normalizeMoney(mortgageAmount) * normalizeRatio(amortizationRate);

  return (annualInterest + annualMaintenance + annualAmortization) / 12;
}

export function calculateAffordabilityRatio(monthlyPayment: number, grossAnnualIncome: number) {
  return calculateRatio(normalizeMoney(monthlyPayment) * 12, grossAnnualIncome);
}

export function calculateGrossAnnualIncome(grossMonthlyIncome: number) {
  return normalizeMoney(grossMonthlyIncome) * 12;
}

export function calculateMaxAffordablePropertyPrice(inputs: MortgageInputs) {
  const annualHousingBudget = normalizeMoney(inputs.grossAnnualIncome) * normalizeRatio(inputs.maxAffordabilityRatio);
  const downPayment = normalizeMoney(inputs.downPayment);
  const financingCostRatio = normalizeRatio(inputs.annualInterestRate) + normalizeRatio(inputs.amortizationRate);
  const annualCostRatio =
    financingCostRatio + normalizeRatio(inputs.maintenanceRate);
  const incomeLimitedPrice =
    annualCostRatio > 0 ? (annualHousingBudget + downPayment * financingCostRatio) / annualCostRatio : 0;
  const requiredDownPaymentRatio = normalizeRatio(inputs.requiredDownPaymentRatio);
  const ltvDownPaymentRatio = normalizeRatio(100 - inputs.maxLoanToValueRatio);
  const minDownPaymentRatio = Math.max(requiredDownPaymentRatio, ltvDownPaymentRatio);
  const downPaymentLimitedPrice = minDownPaymentRatio > 0 ? downPayment / minDownPaymentRatio : 0;
  const hardEquityRatio = normalizeRatio(MIN_HARD_EQUITY_RATIO);
  const hardEquityLimitedPrice = hardEquityRatio > 0 ? getHardEquity(inputs.availableAssets) / hardEquityRatio : 0;

  return Math.min(incomeLimitedPrice, downPaymentLimitedPrice, hardEquityLimitedPrice);
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

function getHardEquity(assets: MortgageAsset[]) {
  return assets
    .filter((asset) => HARD_EQUITY_ASSET_IDS.includes(asset.id))
    .reduce((total, asset) => total + normalizeMoney(asset.amount), 0);
}
