import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const DISCLAIMER = 'This report is for illustrative purposes only and does not constitute financial advice.';

export async function exportDashboardPdf(target: HTMLElement) {
  const generatedAt = new Date();
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const marginX = 12;
  const headerHeight = 22;
  const footerHeight = 15;
  const contentWidth = pageWidth - marginX * 2;
  const availableHeight = pageHeight - headerHeight - footerHeight;
  const dataUrl = await toPng(target, {
    backgroundColor: '#e8eef8',
    cacheBust: true,
    filter: (node) => !(node instanceof HTMLElement && node.closest('[data-pdf-exclude="true"]')),
    pixelRatio: 2,
  });
  const image = await loadImage(dataUrl);
  const imageHeight = (image.height * contentWidth) / image.width;
  const sliceHeightPx = (availableHeight * image.width) / contentWidth;
  const totalPages = Math.max(1, Math.ceil(imageHeight / availableHeight));

  for (let page = 0; page < totalPages; page += 1) {
    if (page > 0) {
      pdf.addPage();
    }

    addHeader(pdf, generatedAt, page === 0);
    const sliceStartPx = page * sliceHeightPx;
    const sliceHeight = Math.min(sliceHeightPx, image.height - sliceStartPx);
    const sliceDataUrl = cropImage(image, sliceStartPx, sliceHeight);
    const sliceDisplayHeight = (sliceHeight * contentWidth) / image.width;

    pdf.addImage(sliceDataUrl, 'PNG', marginX, headerHeight, contentWidth, sliceDisplayHeight);
    addFooter(pdf, page + 1, totalPages);
  }

  pdf.save(`growly-wealth-report-${formatFileDate(generatedAt)}.pdf`);
}

function cropImage(image: HTMLImageElement, sourceY: number, sourceHeight: number) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = Math.ceil(sourceHeight);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to create canvas context for PDF export.');
  }

  context.fillStyle = '#e8eef8';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, sourceY, image.width, sourceHeight, 0, 0, image.width, sourceHeight);

  return canvas.toDataURL('image/png');
}

function addHeader(pdf: jsPDF, generatedAt: Date, isFirstPage: boolean) {
  pdf.setFillColor(248, 251, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), 22, 'F');
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(isFirstPage ? 16 : 12);
  pdf.text(isFirstPage ? 'Growly Wealth Projection Report' : 'Growly Wealth Report', 12, 10);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Generated ${formatDisplayDate(generatedAt)}`, 12, 16);
}

function addFooter(pdf: jsPDF, page: number, totalPages: number) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setDrawColor(203, 213, 225);
  pdf.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(DISCLAIMER, 12, pageHeight - 8);
  pdf.text(`Page ${page} of ${totalPages}`, pageWidth - 12, pageHeight - 8, { align: 'right' });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
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
