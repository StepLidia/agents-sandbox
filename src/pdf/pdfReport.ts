import { jsPDF } from 'jspdf';
import type { FinancialAsset, IncomePlan, InsightAmounts, ProjectionPoint } from '../finance';

const DISCLAIMER = 'This report is for illustrative purposes only and does not constitute financial advice.';

export type FinancialReportData = {
  assets: Array<FinancialAsset & { futureValue: number }>;
  income: IncomePlan;
  insightAmounts: InsightAmounts;
  projectionYears: number;
  totalCurrentWealth: number;
  totalWealth: number;
  pensionWealth: number;
  liquidWealth: number;
  totalProjection: ProjectionPoint[];
  pensionProjection: ProjectionPoint[];
  savingsInvestmentProjection: ProjectionPoint[];
  zeroReturnTotalProjection: ProjectionPoint[];
  zeroReturnPensionProjection: ProjectionPoint[];
  zeroReturnSavingsInvestmentProjection: ProjectionPoint[];
};

type PdfContext = {
  pdf: jsPDF;
  y: number;
  page: number;
  generatedAt: Date;
};

const page = {
  width: 210,
  height: 297,
  marginX: 16,
  top: 22,
  bottom: 22,
};

export function generateFinancialReportPdf(reportData: FinancialReportData) {
  const context: PdfContext = {
    pdf: new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }),
    y: page.top,
    page: 1,
    generatedAt: new Date(),
  };

  drawCoverHeader(context);
  drawSummary(context, reportData);
  drawInputAssumptions(context, reportData);
  drawAllocation(context, reportData.income);
  drawKeyInsights(context, reportData);
  drawProjectionTables(context, reportData);
  drawCharts(context, reportData);
  drawDisclaimer(context);
  finalizePageNumbers(context);

  context.pdf.save(`growly-financial-projection-report-${formatFileDate(context.generatedAt)}.pdf`);
}

function drawCoverHeader(context: PdfContext) {
  const { pdf } = context;

  pdf.setTextColor(35, 35, 35);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.text('Growly Financial Projection Report', page.marginX, context.y);
  context.y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(90, 90, 90);
  pdf.text(`Generated ${formatDisplayDate(context.generatedAt)}`, page.marginX, context.y);
  context.y += 12;
  drawDivider(context);
}

function drawSummary(context: PdfContext, data: FinancialReportData) {
  drawSectionTitle(context, 'Summary');
  drawKeyValueGrid(context, [
    ['Total current wealth', formatMoney(data.totalCurrentWealth)],
    ['Total projected wealth', formatMoney(data.totalWealth)],
    ['Projection period', `${data.projectionYears} years`],
    ['Monthly savings / investment allocation', formatMoney(monthlyFutureAllocation(data.income))],
  ]);
}

function drawInputAssumptions(context: PdfContext, data: FinancialReportData) {
  drawSectionTitle(context, 'Input Assumptions');
  const rows = data.assets.map((asset) => [
    asset.label,
    formatMoney(asset.amount),
    formatMoney(asset.monthlyContribution),
    `${asset.annualReturn.toFixed(2)}%`,
    `${asset.years} years`,
  ]);

  drawTable(context, ['Account', 'Current', 'Monthly', 'Return', 'Period'], rows, [48, 34, 34, 28, 28]);
}

function drawAllocation(context: PdfContext, income: IncomePlan) {
  drawSectionTitle(context, 'Monthly Disposable Income Allocation');
  drawTable(
    context,
    ['Category', 'Amount', 'Share'],
    [
      ['Monthly net income', formatMoney(income.monthlyNetIncome), '100.0%'],
      ['To Savings Account', formatMoney(income.savingsContribution), percent(income.savingsContribution, income.monthlyNetIncome)],
      ['To Investments', formatMoney(income.investmentContribution), percent(income.investmentContribution, income.monthlyNetIncome)],
      ['3rd Pillar', formatMoney(income.pillar3Contribution), percent(income.pillar3Contribution, income.monthlyNetIncome)],
      ['Expenses', formatMoney(income.otherExpenses), percent(income.otherExpenses, income.monthlyNetIncome)],
    ],
    [80, 52, 34],
  );
}

function drawKeyInsights(context: PdfContext, data: FinancialReportData) {
  drawSectionTitle(context, 'Key Insights');
  const insights = [
    'You are building a solid financial foundation.',
    `+200 CHF in investments per month may generate an additional ${formatMoney(data.insightAmounts.extraInvestmentContributionValue)} in ${data.projectionYears} years.`,
    `If markets are favourable, +1% in returns on investments may generate ${formatMoney(data.insightAmounts.favourableMarketReturnValue)} in ${data.projectionYears} years.`,
    `Investing 10,000 CHF from savings into investments may add ${formatMoney(data.insightAmounts.savingsToInvestmentValue)} to total wealth in ${data.projectionYears} years.`,
  ];

  context.pdf.setFont('helvetica', 'normal');
  context.pdf.setFontSize(9.5);
  context.pdf.setTextColor(60, 60, 60);

  for (const insight of insights) {
    ensureSpace(context, 12);
    const lines = context.pdf.splitTextToSize(insight, 165);
    context.pdf.text('•', page.marginX, context.y);
    context.pdf.text(lines, page.marginX + 5, context.y);
    context.y += lines.length * 5 + 2;
  }

  context.y += 2;
}

function drawProjectionTables(context: PdfContext, data: FinancialReportData) {
  drawSectionTitle(context, 'Projection Tables');
  drawProjectionTable(context, 'Total wealth by year', data.totalProjection);
  drawProjectionTable(context, 'Pension wealth by year', data.pensionProjection);
  drawProjectionTable(context, 'Savings + investments by year', data.savingsInvestmentProjection);
}

function drawProjectionTable(context: PdfContext, title: string, points: ProjectionPoint[]) {
  drawSubsectionTitle(context, title);
  const rows = points.map((point) => [String(point.year), formatMoney(point.value)]);
  drawTable(context, ['Year', 'Projected value'], rows, [40, 70], { compact: true });
}

function drawCharts(context: PdfContext, data: FinancialReportData) {
  drawSectionTitle(context, 'Projection Charts');
  drawLineChart(context, 'Total Wealth projection', data.totalProjection, data.zeroReturnTotalProjection);
  drawLineChart(context, 'Pension Wealth projection', data.pensionProjection, data.zeroReturnPensionProjection);
  drawLineChart(context, 'Savings + Investments projection', data.savingsInvestmentProjection, data.zeroReturnSavingsInvestmentProjection);
}

function drawLineChart(context: PdfContext, title: string, points: ProjectionPoint[], zeroReturnPoints: ProjectionPoint[]) {
  const chartHeight = 62;
  const chartWidth = 162;
  const left = page.marginX + 10;
  const topPadding = 8;
  const bottomPadding = 13;
  const leftPadding = 22;
  const rightPadding = 5;

  ensureSpace(context, chartHeight + 16);
  drawSubsectionTitle(context, title);

  const x = left;
  const y = context.y;
  const plotX = x + leftPadding;
  const plotY = y + topPadding;
  const plotWidth = chartWidth - leftPadding - rightPadding;
  const plotHeight = chartHeight - topPadding - bottomPadding;
  const maxYear = Math.max(points.at(-1)?.year ?? 1, 1);
  const maxValue = niceMax(Math.max(...points.map(({ value }) => value), ...zeroReturnPoints.map(({ value }) => value), 1));

  context.pdf.setDrawColor(230, 230, 230);
  context.pdf.setLineWidth(0.2);
  for (let index = 0; index <= 4; index += 1) {
    const gridY = plotY + (plotHeight / 4) * index;
    context.pdf.line(plotX, gridY, plotX + plotWidth, gridY);
    context.pdf.setFont('helvetica', 'normal');
    context.pdf.setFontSize(7);
    context.pdf.setTextColor(110, 110, 110);
    context.pdf.text(formatAxis((maxValue / 4) * (4 - index)), x, gridY + 2);
  }

  context.pdf.setDrawColor(120, 120, 120);
  context.pdf.line(plotX, plotY, plotX, plotY + plotHeight);
  context.pdf.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight);

  drawSeries(context, zeroReturnPoints, plotX, plotY, plotWidth, plotHeight, maxYear, maxValue, [150, 150, 150], true);
  drawSeries(context, points, plotX, plotY, plotWidth, plotHeight, maxYear, maxValue, [40, 40, 40], false);

  context.pdf.setFont('helvetica', 'normal');
  context.pdf.setFontSize(7.5);
  context.pdf.setTextColor(85, 85, 85);
  context.pdf.text('0', plotX, plotY + plotHeight + 6, { align: 'center' });
  context.pdf.text(`${maxYear} years`, plotX + plotWidth, plotY + plotHeight + 6, { align: 'right' });
  context.pdf.text('Actual return', plotX + 6, y + chartHeight - 1);
  context.pdf.text('0% return', plotX + 42, y + chartHeight - 1);
  context.pdf.setDrawColor(40, 40, 40);
  context.pdf.line(plotX, y + chartHeight - 2, plotX + 5, y + chartHeight - 2);
  context.pdf.setDrawColor(150, 150, 150);
  context.pdf.setLineDashPattern([2, 2], 0);
  context.pdf.line(plotX + 36, y + chartHeight - 2, plotX + 41, y + chartHeight - 2);
  context.pdf.setLineDashPattern([], 0);

  context.y += chartHeight + 6;
}

function drawSeries(
  context: PdfContext,
  points: ProjectionPoint[],
  plotX: number,
  plotY: number,
  plotWidth: number,
  plotHeight: number,
  maxYear: number,
  maxValue: number,
  color: [number, number, number],
  dashed: boolean,
) {
  if (points.length < 2) {
    return;
  }

  context.pdf.setDrawColor(...color);
  context.pdf.setLineWidth(dashed ? 0.45 : 0.75);
  context.pdf.setLineDashPattern(dashed ? [2, 2] : [], 0);

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    context.pdf.line(
      plotX + (previous.year / maxYear) * plotWidth,
      plotY + (1 - previous.value / maxValue) * plotHeight,
      plotX + (current.year / maxYear) * plotWidth,
      plotY + (1 - current.value / maxValue) * plotHeight,
    );
  }

  context.pdf.setLineDashPattern([], 0);
}

function drawSectionTitle(context: PdfContext, title: string) {
  ensureSpace(context, 14);
  context.pdf.setFont('helvetica', 'bold');
  context.pdf.setFontSize(13);
  context.pdf.setTextColor(45, 45, 45);
  context.pdf.text(title, page.marginX, context.y);
  context.y += 5;
  drawDivider(context);
}

function drawSubsectionTitle(context: PdfContext, title: string) {
  ensureSpace(context, 10);
  context.pdf.setFont('helvetica', 'bold');
  context.pdf.setFontSize(10.5);
  context.pdf.setTextColor(55, 55, 55);
  context.pdf.text(title, page.marginX, context.y);
  context.y += 5;
}

function drawDivider(context: PdfContext) {
  context.pdf.setDrawColor(190, 190, 190);
  context.pdf.setLineWidth(0.3);
  context.pdf.line(page.marginX, context.y, page.width - page.marginX, context.y);
  context.y += 7;
}

function drawKeyValueGrid(context: PdfContext, rows: Array<[string, string]>) {
  const columnWidth = 86;
  const rowHeight = 16;

  for (let index = 0; index < rows.length; index += 1) {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = page.marginX + column * (columnWidth + 6);
    const y = context.y + row * (rowHeight + 4);

    context.pdf.setFillColor(245, 245, 245);
    context.pdf.setDrawColor(210, 210, 210);
    context.pdf.rect(x, y, columnWidth, rowHeight, 'FD');
    context.pdf.setFont('helvetica', 'normal');
    context.pdf.setFontSize(8);
    context.pdf.setTextColor(95, 95, 95);
    context.pdf.text(rows[index][0], x + 3, y + 5);
    context.pdf.setFont('helvetica', 'bold');
    context.pdf.setFontSize(10);
    context.pdf.setTextColor(35, 35, 35);
    context.pdf.text(rows[index][1], x + 3, y + 12);
  }

  context.y += Math.ceil(rows.length / 2) * (rowHeight + 4) + 4;
}

function drawTable(
  context: PdfContext,
  headers: string[],
  rows: string[][],
  widths: number[],
  options: { compact?: boolean } = {},
) {
  const rowHeight = options.compact ? 6 : 8;
  const headerHeight = 8;
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);

  ensureSpace(context, headerHeight + rowHeight + 4);
  drawTableHeader(context, headers, widths, tableWidth, headerHeight);

  for (const row of rows) {
    ensureSpace(context, rowHeight + page.bottom, () => drawTableHeader(context, headers, widths, tableWidth, headerHeight));
    let x = page.marginX;

    context.pdf.setFillColor(255, 255, 255);
    context.pdf.setDrawColor(225, 225, 225);
    context.pdf.rect(page.marginX, context.y, tableWidth, rowHeight, 'S');
    context.pdf.setFont('helvetica', 'normal');
    context.pdf.setFontSize(options.compact ? 7.5 : 8.5);
    context.pdf.setTextColor(45, 45, 45);

    row.forEach((cell, index) => {
      context.pdf.text(cell, x + 2, context.y + rowHeight - 2.2);
      x += widths[index];
    });

    context.y += rowHeight;
  }

  context.y += 6;
}

function drawTableHeader(context: PdfContext, headers: string[], widths: number[], tableWidth: number, headerHeight: number) {
  context.pdf.setFillColor(238, 238, 238);
  context.pdf.setDrawColor(205, 205, 205);
  context.pdf.rect(page.marginX, context.y, tableWidth, headerHeight, 'FD');
  context.pdf.setFont('helvetica', 'bold');
  context.pdf.setFontSize(8);
  context.pdf.setTextColor(55, 55, 55);

  let x = page.marginX;
  headers.forEach((header, index) => {
    context.pdf.text(header, x + 2, context.y + 5.3);
    x += widths[index];
  });

  context.y += headerHeight;
}

function drawDisclaimer(context: PdfContext) {
  drawSectionTitle(context, 'Disclaimer');
  context.pdf.setFont('helvetica', 'normal');
  context.pdf.setFontSize(9);
  context.pdf.setTextColor(70, 70, 70);
  context.pdf.text(context.pdf.splitTextToSize(DISCLAIMER, 170), page.marginX, context.y);
}

function ensureSpace(context: PdfContext, neededHeight: number, afterPageBreak?: () => void) {
  if (context.y + neededHeight <= page.height - page.bottom) {
    return;
  }

  addFooter(context);
  context.pdf.addPage();
  context.page += 1;
  context.y = page.top;
  drawPageHeader(context);
  afterPageBreak?.();
}

function drawPageHeader(context: PdfContext) {
  context.pdf.setFont('helvetica', 'bold');
  context.pdf.setFontSize(9);
  context.pdf.setTextColor(80, 80, 80);
  context.pdf.text('Growly Financial Projection Report', page.marginX, 12);
  context.pdf.setDrawColor(215, 215, 215);
  context.pdf.line(page.marginX, 16, page.width - page.marginX, 16);
}

function addFooter(context: PdfContext, totalPages?: number) {
  const { pdf } = context;
  pdf.setDrawColor(215, 215, 215);
  pdf.line(page.marginX, page.height - 15, page.width - page.marginX, page.height - 15);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(90, 90, 90);
  pdf.text(`Page ${context.page}${totalPages ? ` of ${totalPages}` : ''}`, page.width - page.marginX, page.height - 8, {
    align: 'right',
  });
}

function finalizePageNumbers(context: PdfContext) {
  const totalPages = context.pdf.getNumberOfPages();

  for (let index = 1; index <= totalPages; index += 1) {
    context.pdf.setPage(index);
    context.page = index;
    addFooter(context, totalPages);
  }
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))} CHF`;
}

function percent(value: number, total: number) {
  return total <= 0 ? '0.0%' : `${((value / total) * 100).toFixed(1)}%`;
}

function monthlyFutureAllocation(income: IncomePlan) {
  return income.savingsContribution + income.investmentContribution + income.pillar3Contribution;
}

function niceMax(value: number) {
  const roughStep = value / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return Math.max(niceStep * magnitude, Math.ceil(value / (niceStep * magnitude)) * niceStep * magnitude);
}

function formatAxis(value: number) {
  if (value >= 1000000) {
    return `${Number((value / 1000000).toFixed(1))}M`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`;
  }

  return String(Math.round(value));
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatFileDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
