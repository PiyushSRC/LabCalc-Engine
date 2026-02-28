import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LabReportData } from './generateMarkdown';

// ═══════════════════════════════════════════════════════════════
// SPACING CONSTANTS (all in mm, converted from design spec px)
// ═══════════════════════════════════════════════════════════════
const MARGIN = {
  top: 14,
  bottom: 14,
  left: 18,
  right: 18,
} as const;

const LOGO = {
  height: 12,
  marginBottom: 10,
} as const;

const TITLE = {
  fontSize: 22,
  marginBottom: 3,
} as const;

const TIMESTAMP = {
  fontSize: 8,
  marginBottom: 11,
} as const;

const META_BOX = {
  paddingX: 7,
  paddingY: 6,
  rowGap: 4,
  labelValueGap: 1.5,
  borderRadius: 2,
  marginBottom: 12,
  labelFontSize: 7.5,
  valueFontSize: 10,
  colSpacing: 55,
} as const;

const TABLE = {
  headerFontSize: 8.5,
  bodyFontSize: 9,
  headerPaddingV: 4,
  bodyPaddingV: 3.8,
  columnWidths: { id: 0.15, normalOd: 0.20, normalCalc: 0.22, srcOd: 0.20, srcCalc: 0.23 },
} as const;

const FOOTER = {
  fontSize: 7,
  bottomOffset: 10,
} as const;

// ═══════════════════════════════════════════════════════════════
// COLOR CONSTANTS (RGB tuples)
// ═══════════════════════════════════════════════════════════════
type RGB = [number, number, number];

const COLOR = {
  black: [17, 24, 39] as RGB,
  white: [255, 255, 255] as RGB,
  gray500: [107, 114, 128] as RGB,
  gray400: [156, 163, 175] as RGB,
  gray300: [209, 213, 219] as RGB,
  gray200: [229, 231, 235] as RGB,
  gray100: [243, 244, 246] as RGB,
  blue: [37, 99, 235] as RGB,
  green: [5, 150, 105] as RGB,
  bodyText: [30, 30, 30] as RGB,
  mutedText: [90, 90, 90] as RGB,
} as const;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function fmt(value: number | null): string {
  return value != null ? value.toFixed(2) : '-';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════
async function buildPDFDocument(report: LabReportData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();   // 210
  const pageH = doc.internal.pageSize.getHeight();   // 297
  const contentW = pageW - MARGIN.left - MARGIN.right; // ~174

  let y = MARGIN.top;

  // ─── LOGO ───────────────────────────────────────────────────
  try {
    const logoImg = await loadImage('/src-logo.png');
    const logoW = (logoImg.width / logoImg.height) * LOGO.height;
    doc.addImage(logoImg, 'PNG', MARGIN.left, y, logoW, LOGO.height);
    y += LOGO.height + LOGO.marginBottom;
  } catch {
    y += 2;
  }

  // ─── TITLE ──────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(TITLE.fontSize);
  doc.setTextColor(...COLOR.black);
  doc.text('Laboratory Summary Report', MARGIN.left, y);
  y += TITLE.marginBottom;

  // ─── TIMESTAMP ──────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(TIMESTAMP.fontSize);
  doc.setTextColor(...COLOR.gray500);
  doc.text(`Report Timestamp: ${new Date().toLocaleString()}`, MARGIN.left, y + 4);
  y += TIMESTAMP.marginBottom + 4;

  // ─── METADATA BOX ──────────────────────────────────────────
  const metaBoxX = MARGIN.left;
  const metaBoxW = contentW;

  // Compute box height dynamically
  const metaRowHeight = META_BOX.labelFontSize * 0.353 + META_BOX.labelValueGap + META_BOX.valueFontSize * 0.353;
  const metaBoxH = META_BOX.paddingY * 2 + metaRowHeight * 2 + META_BOX.rowGap;

  // Draw box background + border
  doc.setFillColor(...COLOR.gray100);
  doc.setDrawColor(...COLOR.gray300);
  doc.setLineWidth(0.3);
  doc.roundedRect(metaBoxX, y, metaBoxW, metaBoxH, META_BOX.borderRadius, META_BOX.borderRadius, 'FD');

  // Column X positions inside box
  const mc1 = metaBoxX + META_BOX.paddingX;
  const mc2 = mc1 + META_BOX.colSpacing;
  const mc3 = mc2 + META_BOX.colSpacing;

  // Row 1
  let metaY = y + META_BOX.paddingY + 3;

  // Labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(META_BOX.labelFontSize);
  doc.setTextColor(...COLOR.gray500);
  doc.text('CONCENTRATION:', mc1, metaY);
  doc.text('STD. O.D.:', mc2, metaY);
  doc.text('SOLVENT:', mc3, metaY);

  // Values
  metaY += META_BOX.labelValueGap + 4;
  doc.setFont('courier', 'bold');
  doc.setFontSize(META_BOX.valueFontSize);
  doc.setTextColor(...COLOR.black);
  doc.text(fmt(report.concentration), mc1, metaY);
  doc.text(fmt(report.stdOD), mc2, metaY);
  doc.text(report.solvent || '-', mc3, metaY);

  // Row 2
  metaY += META_BOX.rowGap + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(META_BOX.labelFontSize);
  doc.setTextColor(...COLOR.gray500);
  doc.text('NORMAL DATE:', mc1, metaY);
  doc.text('SRC DATE:', mc2, metaY);

  metaY += META_BOX.labelValueGap + 4;
  doc.setFont('courier', 'bold');
  doc.setFontSize(META_BOX.valueFontSize);
  doc.setTextColor(...COLOR.black);
  doc.text(report.normalDate || '-', mc1, metaY);
  doc.text(report.srcDate || '-', mc2, metaY);

  y += metaBoxH + META_BOX.marginBottom;

  // ─── TABLE ─────────────────────────────────────────────────
  const headers = ['Sample ID', 'Normal: O.D.', 'Normal: Calc', 'SRC: O.D.', 'SRC: Calc'];
  const cw = TABLE.columnWidths;
  const colWidths = [
    contentW * cw.id,
    contentW * cw.normalOd,
    contentW * cw.normalCalc,
    contentW * cw.srcOd,
    contentW * cw.srcCalc,
  ];

  const body = report.rows.length > 0
    ? report.rows.map((row) => [
        String(row.id),
        fmt(row.normalOD),
        fmt(row.normalCalc),
        fmt(row.postOD),
        fmt(row.postCalc),
      ])
    : [['-', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: y,
    head: [headers],
    body: body,
    margin: { left: MARGIN.left, right: MARGIN.right, bottom: MARGIN.bottom + 6 },
    tableWidth: contentW,
    showHead: 'everyPage',

    // ── Global cell styles ──
    styles: {
      fontSize: TABLE.bodyFontSize,
      font: 'courier',
      fontStyle: 'normal',
      textColor: COLOR.bodyText,
      cellPadding: {
        top: TABLE.bodyPaddingV,
        bottom: TABLE.bodyPaddingV,
        left: 3,
        right: 3,
      },
      lineColor: COLOR.gray200,
      lineWidth: 0.3,
      halign: 'center',
      valign: 'middle',
      overflow: 'linebreak',
    },

    // ── Header row ──
    headStyles: {
      fillColor: COLOR.black,
      textColor: COLOR.white,
      fontStyle: 'bold',
      font: 'courier',
      fontSize: TABLE.headerFontSize,
      cellPadding: {
        top: TABLE.headerPaddingV,
        bottom: TABLE.headerPaddingV,
        left: 3,
        right: 3,
      },
      lineWidth: 0,
    },

    // ── Body rows ──
    bodyStyles: {
      fillColor: COLOR.white,
    },

    // ── Per-column overrides ──
    columnStyles: {
      0: { cellWidth: colWidths[0], fontStyle: 'normal', textColor: COLOR.bodyText },
      1: { cellWidth: colWidths[1], textColor: COLOR.mutedText },
      2: { cellWidth: colWidths[2], textColor: COLOR.blue, fontStyle: 'bold' },
      3: { cellWidth: colWidths[3], textColor: COLOR.mutedText },
      4: { cellWidth: colWidths[4], textColor: COLOR.green, fontStyle: 'bold' },
    },

    // ── No zebra striping ──
    alternateRowStyles: {
      fillColor: COLOR.white,
    },

    // ── Draw borders only bottom per row ──
    tableLineColor: COLOR.gray200,
    tableLineWidth: 0,

    didParseCell: (data) => {
      // Top border only on first body row, bottom border on all
      if (data.section === 'body') {
        data.cell.styles.lineWidth = { bottom: 0.2, top: 0, left: 0, right: 0 };
        data.cell.styles.lineColor = COLOR.gray200;
      }
    },
  });

  // ─── FOOTER (post-process for correct total page count) ────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.getHeight();

    doc.setFont('courier', 'normal');
    doc.setFontSize(FOOTER.fontSize);
    doc.setTextColor(...COLOR.gray400);
    doc.text(
      `Page ${i} of ${totalPages}  |  Generated via LabCalc Engine Professional`,
      pageW / 2,
      pH - FOOTER.bottomOffset,
      { align: 'center' },
    );
  }

  return doc;
}

export async function generatePDF(report: LabReportData): Promise<void> {
  const doc = await buildPDFDocument(report);
  const safeSolvent = (report.solvent || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`LabReport_${safeSolvent}_${dateStr}.pdf`);
}

export async function printPDF(report: LabReportData): Promise<void> {
  const doc = await buildPDFDocument(report);
  const blobUrl = doc.output('bloburl');
  const printWindow = window.open(blobUrl as unknown as string, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  }
}
