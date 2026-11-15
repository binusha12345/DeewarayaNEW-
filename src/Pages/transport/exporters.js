// CSV (opens in Excel) and PDF exports for transport reports, using the existing jspdf + file-saver deps.
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";
import { dOnly, money } from "../../services/transportApi";

const cell = (v) => (v == null ? "" : String(v));

// columns: [{ label, value(row) }]
export const exportCsv = (filename, columns, rows) => {
  const esc = (v) => {
    const s = cell(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.label)).join(","), ...rows.map((r) => columns.map((c) => esc(c.value(r))).join(","))];
  // BOM so Excel reads UTF-8 (Sinhala fish names) correctly.
  saveAs(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
};

// Simple paginated table PDF (landscape A4). jsPDF's built-in font is Latin-only, so non-Latin
// characters are stripped in the PDF; the CSV keeps them.
export const exportPdf = (filename, title, columns, rows, { subtitle = "", summary = [] } = {}) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 36;
  const latin = (s) => cell(s).replace(/[^\x20-\x7E]/g, "").trim();
  const colW = (W - M * 2) / columns.length;
  let y = M;

  const header = () => {
    doc.setFillColor(16, 42, 67);
    doc.rect(0, 0, W, 54, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(latin(title), M, 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(latin(`Deewaraya Fish Transportation · ${subtitle} · generated ${new Date().toLocaleString()}`), M, 40);
    y = 76;
    doc.setTextColor(16, 42, 67);
  };
  const tableHead = () => {
    doc.setFillColor(234, 243, 255);
    doc.rect(M, y - 11, W - M * 2, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    columns.forEach((c, i) => doc.text(latin(c.label).slice(0, 28), M + 4 + i * colW, y));
    doc.setFont("helvetica", "normal");
    y += 16;
  };

  header();
  if (summary.length) {
    doc.setFontSize(10);
    summary.forEach(([k, v]) => {
      doc.text(`${latin(k)}: ${latin(v)}`, M, y);
      y += 14;
    });
    y += 8;
  }
  tableHead();
  doc.setFontSize(8);
  rows.forEach((r) => {
    if (y > H - M) {
      doc.addPage();
      header();
      tableHead();
      doc.setFontSize(8);
    }
    columns.forEach((c, i) => {
      const text = doc.splitTextToSize(latin(c.value(r)), colW - 6)[0] || "";
      doc.text(text, M + 4 + i * colW, y);
    });
    y += 13;
  });
  if (!rows.length) doc.text("No records for this period.", M, y);
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Page ${i} of ${pages}`, W - M - 50, H - 16);
  }
  doc.save(`${filename}.pdf`);
};

// Fetch every page of a paginated list endpoint (capped to keep exports bounded).
export const fetchAll = async (fetcher, params, maxPages = 50) => {
  const out = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const r = await fetcher({ ...params, page, limit: 100 });
    out.push(...(r.data || []));
    if (!r.pagination || page >= r.pagination.pages) break;
  }
  return out;
};

// Buyer invoice PDF.
export const downloadInvoicePdf = (inv) =>
  exportPdf(
    inv.invoiceNumber,
    `Invoice ${inv.invoiceNumber}`,
    [
      { label: "Fish", value: (l) => l.fishName },
      { label: "Loaded kg", value: (l) => l.loadedKg },
      { label: "Accepted kg", value: (l) => l.acceptedKg },
      { label: "Damaged kg", value: (l) => l.damagedKg },
      { label: "Missing kg", value: (l) => l.missingKg },
      { label: "Price/kg (LKR)", value: (l) => l.pricePerKg?.toFixed(2) },
      { label: "Accepted value (LKR)", value: (l) => l.acceptedValue?.toFixed(2) },
    ],
    inv.lines,
    {
      subtitle: `Order ${inv.order?.orderNumber || ""} · Delivery ${inv.delivery?.deliveryNumber || ""}`,
      summary: [
        ["Buyer", `${inv.buyerSnapshot?.name || ""} ${inv.buyerSnapshot?.businessName ? `(${inv.buyerSnapshot.businessName})` : ""} · ${inv.buyerSnapshot?.phone || ""}`],
        ["Issued / due", `${dOnly(inv.issuedAt)} / ${dOnly(inv.dueDate)}`],
        ["Accepted fish value", money(inv.totals.acceptedValue)],
        ["Approved additional charges", money(inv.totals.additionalCharges)],
        ["Discounts", money(inv.totals.discounts)],
        ["Refunds", money(inv.totals.refunds)],
        ["FINAL PAYABLE", money(inv.totals.finalPayable)],
        ["Paid", `${money(inv.amountPaid - inv.amountRefunded)} · ${inv.paymentStatus}`],
      ],
    }
  );
