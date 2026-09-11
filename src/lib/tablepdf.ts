/* Render string[][] as a clean formatted table inside a PDF.
   Shared by xlsx→pdf and csv→pdf. Handles wide tables two ways:
   scale-to-fit (shrink font) or multi-page-wide (column continuation pages). */
import { PDFDocument, StandardFonts, rgb, type PDFPage } from "pdf-lib";

export type TableMode = "fit" | "multi" | "auto";

export interface TablePdfResult {
  data: Uint8Array;
  pageCount: number;
  truncated: boolean;
  modeUsed: "fit" | "multi" | "single";
  colGroups: number;
}

const MAX_ROWS = 4000;
const A4: [number, number] = [595.28, 841.89];
const MARGIN = 34;

export async function tableToPdf(rowsIn: string[][], mode: TableMode = "auto"): Promise<TablePdfResult> {
  let truncated = false;
  if (!rowsIn.length) throw new Error("No data found to render.");
  let rows = rowsIn;
  if (rows.length > MAX_ROWS) { rows = rows.slice(0, MAX_ROWS); truncated = true; }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const cols = Math.max(...rows.map((r) => r.length), 1);
  if (cols > 200) { rows = rows.map((r) => r.slice(0, 200)); truncated = true; }
  const norm = rows.map((r) => Array.from({ length: cols }, (_, i) => (r[i] ?? "").replace(/\s+/g, " ").trim()));

  const BASE_FS = 9, PAD = 5;
  const cap = (s: string) => (s.length > 60 ? s.slice(0, 57) + "…" : s);
  const header = norm[0].map(cap);
  const body = norm.slice(1).map((r) => r.map(cap));

  // column widths (account for header bold)
  const cw: number[] = Array.from({ length: cols }, (_, c) => {
    let w = 42;
    w = Math.max(w, bold.widthOfTextAtSize(header[c] || " ", BASE_FS) + PAD * 2);
    const sample = Math.min(body.length, 200);
    for (let r = 0; r < sample; r++) w = Math.max(w, font.widthOfTextAtSize(body[r][c] || " ", BASE_FS) + PAD * 2);
    return Math.min(w, 170);
  });

  const [PW, PH] = A4;
  const availW = PW - MARGIN * 2;
  const totalW = cw.reduce((a, b) => a + b, 0);

  let modeUsed: TablePdfResult["modeUsed"] = "single";
  let scale = Math.min(1, availW / totalW);
  if (mode === "auto") modeUsed = totalW <= availW ? "single" : scale >= 0.5 ? "fit" : "multi";
  else if (mode === "fit") modeUsed = "fit";
  else modeUsed = "multi";
  if (modeUsed === "fit") scale = Math.max(0.3, scale);

  // column groups for multi-page-wide
  const groups: number[][] = [];
  if (modeUsed === "multi") {
    let cur: number[] = [], w = 0;
    for (let c = 0; c < cols; c++) {
      if (w + cw[c] > availW && cur.length) { groups.push(cur); cur = []; w = 0; }
      cur.push(c); w += cw[c];
    }
    if (cur.length) groups.push(cur);
    scale = 1;
  } else groups.push(Array.from({ length: cols }, (_, i) => i));

  const FS = BASE_FS * scale;
  const PD = PAD * scale;
  const rowH = FS + PD * 2 + 2;
  const scw = cw.map((w) => w * scale);

  const inkDark = rgb(0.1, 0.1, 0.12);
  const headerBg = rgb(0.09, 0.1, 0.11);
  const acid = rgb(0.804, 1, 0.24);
  const rowAlt = rgb(0.955, 0.96, 0.965);
  const lineCol = rgb(0.82, 0.83, 0.85);

  let page: PDFPage | null = null;
  let y = 0;
  let pages = 0;

  const drawHeader = (group: number[]) => {
    if (!page) return 0;
    let x = MARGIN;
    page.drawRectangle({ x: MARGIN, y: y - rowH, width: group.reduce((a, c) => a + scw[c], 0), height: rowH, color: headerBg });
    group.forEach((c) => {
      let t = header[c] || " ";
      while (t.length > 1 && bold.widthOfTextAtSize(t, FS) > scw[c] - PD * 2) t = t.slice(0, -2) + "…";
      page!.drawText(t, { x: x + PD, y: y - rowH + PD + 1.5, size: FS, font: bold, color: acid });
      x += scw[c];
    });
    return rowH;
  };

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    if (g > 0 || pages === 0) { newPageSafe(); }

    function newPageSafe() {
      page = doc.addPage(A4);
      pages++;
      y = PH - MARGIN;
      y -= drawHeader(group);
    }
    if (pages === 0) newPageSafe();

    for (let r = 0; r < body.length; r++) {
      if (y - rowH < MARGIN) newPageSafe();
      if (r % 2 === 1) page!.drawRectangle({ x: MARGIN, y: y - rowH, width: group.reduce((a, c) => a + scw[c], 0), height: rowH, color: rowAlt });
      let x = MARGIN;
      group.forEach((c) => {
        let t = body[r][c] || " ";
        while (t.length > 1 && font.widthOfTextAtSize(t, FS) > scw[c] - PD * 2) t = t.slice(0, -2) + "…";
        page!.drawText(t, { x: x + PD, y: y - rowH + PD + 1.5, size: FS, font, color: inkDark });
        x += scw[c];
      });
      page!.drawLine({ start: { x: MARGIN, y: y - rowH }, end: { x: MARGIN + group.reduce((a, c) => a + scw[c], 0), y: y - rowH }, thickness: 0.5, color: lineCol });
      y -= rowH;
    }

    // vertical rules + outer frame
    let x = MARGIN;
    page!.drawLine({ start: { x, y: PH - MARGIN }, end: { x, y }, thickness: 0.5, color: lineCol });
    group.forEach((c) => {
      x += scw[c];
      page!.drawLine({ start: { x, y: PH - MARGIN }, end: { x, y }, thickness: 0.5, color: lineCol });
    });
    page!.drawText(`Page ${pages}${groups.length > 1 ? ` · columns ${group[0] + 1}–${group[group.length - 1] + 1}` : ""}`, {
      x: MARGIN, y: MARGIN - 14, size: 7.5, font, color: rgb(0.5, 0.5, 0.52),
    });
  }

  return { data: await doc.save(), pageCount: pages, truncated, modeUsed, colGroups: groups.length };
}
