import { ProposalData } from "../types/proposal";

export async function generateProposalPdf(data: ProposalData): Promise<void> {
  // Dynamically import jsPDF to keep it client-side only
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Color palette
  const primaryColor: [number, number, number] = [37, 99, 235];   // blue-600
  const darkColor: [number, number, number] = [17, 24, 39];       // gray-900
  const mutedColor: [number, number, number] = [107, 114, 128];   // gray-500
  const lightBg: [number, number, number] = [248, 250, 252];      // slate-50

  let y = margin;

  // ─── HEADER BACKGROUND ───────────────────────────────────────────────────────
  doc.setFillColor(...lightBg);
  doc.rect(0, 0, pageWidth, 52, "F");

  // ─── LOGO ────────────────────────────────────────────────────────────────────
  if (data.businessInfo.logo) {
    try {
      const logoX = margin;
      const maxLogoH = 22;
      const maxLogoW = 55;

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          let lw = maxLogoW;
          let lh = lw / ratio;
          if (lh > maxLogoH) {
            lh = maxLogoH;
            lw = lh * ratio;
          }
          doc.addImage(data.businessInfo.logo!, "PNG", logoX, y + 4, lw, lh);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = data.businessInfo.logo!;
      });
    } catch {
      // logo failed to load, skip
    }
  }

  // ─── PROPOSAL TITLE (right side) ─────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...primaryColor);
  doc.text("PROPOSAL", pageWidth - margin, y + 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text(`#${data.proposalNumber}`, pageWidth - margin, y + 17, { align: "right" });
  doc.text(`Date: ${data.proposalDate}`, pageWidth - margin, y + 22, { align: "right" });
  if (data.validUntil) {
    doc.text(`Valid until: ${data.validUntil}`, pageWidth - margin, y + 27, { align: "right" });
  }

  y = 58;

  // ─── FROM / TO ────────────────────────────────────────────────────────────────
  const colW = contentWidth / 2 - 4;

  // "From" block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text("FROM", margin, y);

  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.businessInfo.name || "—", margin, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedColor);
  const fromLines: string[] = [];
  if (data.businessInfo.email) fromLines.push(data.businessInfo.email);
  if (data.businessInfo.phone) fromLines.push(data.businessInfo.phone);
  if (data.businessInfo.address) fromLines.push(data.businessInfo.address);
  if (data.businessInfo.city || data.businessInfo.country) {
    fromLines.push([data.businessInfo.city, data.businessInfo.country].filter(Boolean).join(", "));
  }
  if (data.businessInfo.website) fromLines.push(data.businessInfo.website);
  fromLines.forEach((line, i) => doc.text(line, margin, y + 12 + i * 5));

  // "To" block
  const toX = margin + colW + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text("BILL TO", toX, y);

  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(data.clientInfo.name || "—", toX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedColor);
  const toLines: string[] = [];
  if (data.clientInfo.email) toLines.push(data.clientInfo.email);
  if (data.clientInfo.phone) toLines.push(data.clientInfo.phone);
  if (data.clientInfo.address) toLines.push(data.clientInfo.address);
  if (data.clientInfo.city || data.clientInfo.country) {
    toLines.push([data.clientInfo.city, data.clientInfo.country].filter(Boolean).join(", "));
  }
  toLines.forEach((line, i) => doc.text(line, toX, y + 12 + i * 5));

  const blockHeight = Math.max(fromLines.length, toLines.length) * 5 + 20;
  y += blockHeight;

  // ─── LINE ITEMS TABLE ─────────────────────────────────────────────────────────
  const sym = data.currencySymbol;

  const tableRows = data.lineItems.map((item) => [
    item.description,
    item.quantity.toString(),
    `${sym}${item.unitPrice.toFixed(2)}`,
    `${sym}${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: y + 4,
    head: [["Description", "Qty", "Unit Price", "Total"]],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: darkColor,
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 18, halign: "right" },
      2: { cellWidth: 32, halign: "right" },
      3: { cellWidth: 32, halign: "right" },
    },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didDrawPage: () => {},
  });

  // ─── TOTALS ───────────────────────────────────────────────────────────────────
  const finalY: number = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  const totalsX = pageWidth - margin - 75;
  let ty = finalY;

  const drawTotalRow = (label: string, value: string, bold = false, large = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(large ? 11 : 9);
    doc.setTextColor(...(bold ? darkColor : mutedColor));
    doc.text(label, totalsX, ty);
    doc.text(value, pageWidth - margin, ty, { align: "right" });
    ty += large ? 7 : 5.5;
  };

  drawTotalRow("Subtotal:", `${sym}${subtotal.toFixed(2)}`);
  if (data.taxRate > 0) {
    drawTotalRow(`Tax (${data.taxRate}%):`, `${sym}${taxAmount.toFixed(2)}`);
  }

  // Divider
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX, ty, pageWidth - margin, ty);
  ty += 4;

  drawTotalRow("TOTAL:", `${data.currency} ${sym}${total.toFixed(2)}`, true, true);

  // ─── NOTES & TERMS ────────────────────────────────────────────────────────────
  ty += 8;

  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text("Notes", margin, ty);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedColor);
    const noteLines = doc.splitTextToSize(data.notes, contentWidth / 2 - 4);
    doc.text(noteLines, margin, ty + 5);
    ty += 5 + noteLines.length * 5;
  }

  if (data.terms) {
    ty += data.notes ? 4 : 0;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...darkColor);
    doc.text("Terms & Conditions", margin, ty);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedColor);
    const termLines = doc.splitTextToSize(data.terms, contentWidth);
    doc.text(termLines, margin, ty + 5);
  }

  // ─── FOOTER ───────────────────────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.text(
    `Generated by Proposely — ${data.businessInfo.name}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  // Save
  const filename = `proposal-${data.proposalNumber || "draft"}-${data.clientInfo.name || "client"}.pdf`
    .toLowerCase()
    .replace(/\s+/g, "-");
  doc.save(filename);
}
