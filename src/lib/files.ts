/* Shared file-processing helpers for the File Converters category */
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/* ── pdfjs setup ── */
let workerReady = false;
export function initPdfjs() {
  if (!workerReady) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    workerReady = true;
  }
  return pdfjsLib;
}

export interface PdfPageShim {
  getViewport(o: { scale: number }): { width: number; height: number };
  render(o: Record<string, unknown>): { promise: Promise<unknown> };
  getTextContent(): Promise<{ items: unknown[] }>;
}
export interface PdfDocShim {
  numPages: number;
  getPage(n: number): Promise<PdfPageShim>;
  destroy(): Promise<void>;
}

export class PdfPasswordError extends Error {
  constructor() { super("This PDF is password-protected. Unlock it first, then try again."); this.name = "PdfPasswordError"; }
}

export async function loadPdf(buf: ArrayBuffer): Promise<PdfDocShim> {
  const p = initPdfjs();
  try {
    const task = p.getDocument({ data: new Uint8Array(buf.slice(0)) });
    return (await task.promise) as unknown as PdfDocShim;
  } catch (e) {
    const name = (e as Error)?.name || "";
    if (name.includes("Password")) throw new PdfPasswordError();
    if (name === "InvalidPDFException" || name.includes("InvalidPDF")) throw new Error("That file doesn't look like a valid PDF.");
    throw e;
  }
}

export async function renderPage(page: PdfPageShim, canvas: HTMLCanvasElement, scale = 2) {
  const viewport = page.getViewport({ scale });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;
}

/* ── text extraction ── */
export interface PdfTextItem { str: string; transform: number[]; width: number; height: number; fontName?: string }
export interface LineCell { x: number; w: number; str: string; h: number; font: string }
export interface TextLine { y: number; cells: LineCell[] }

export async function pageTextItems(page: PdfPageShim): Promise<PdfTextItem[]> {
  const c = await page.getTextContent();
  return c.items.filter((i): i is PdfTextItem => typeof (i as PdfTextItem).str === "string");
}

export function groupLines(items: PdfTextItem[]): TextLine[] {
  const lines: TextLine[] = [];
  const sorted = [...items].filter((i) => i.str.trim()).sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
  for (const it of sorted) {
    const y = it.transform[5], x = it.transform[4];
    const tol = Math.max(2, (it.height || 8) * 0.5);
    let line = lines.find((l) => Math.abs(l.y - y) <= tol);
    if (!line) { line = { y, cells: [] }; lines.push(line); }
    line.cells.push({ x, w: it.width || it.str.length * 4, str: it.str, h: it.height || 8, font: it.fontName || "" });
  }
  lines.sort((a, b) => b.y - a.y);
  for (const l of lines) l.cells.sort((a, b) => a.x - b.x);
  return lines;
}

/* group lines into spreadsheet-style rows where big x-gaps split cells */
export function linesToRows(lines: TextLine[], gapThreshold = 12): string[][] {
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = "";
    let curEnd = -Infinity;
    for (const c of line.cells) {
      if (c.x - curEnd > gapThreshold && cur) { cells.push(cur.trim()); cur = ""; }
      cur += (cur ? " " : "") + c.str;
      curEnd = Math.max(curEnd, c.x + c.w);
    }
    if (cur) cells.push(cur.trim());
    return cells;
  });
}

/* ── page range parser ── */
export function parsePageRanges(input: string, max: number): number[] {
  const out: number[] = [];
  for (const part of input.split(",")) {
    const p = part.trim();
    if (!p) continue;
    const m = p.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = +m[1], b = +m[2];
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) if (i >= 1 && i <= max) out.push(i - 1);
    } else if (/^\d+$/.test(p)) {
      const n = +p;
      if (n >= 1 && n <= max) out.push(n - 1);
    } else {
      throw new Error(`Can't parse “${p}”. Use formats like: 2, 5, 9-12`);
    }
  }
  if (!out.length) throw new Error(`No valid pages — the document has ${max} page${max === 1 ? "" : "s"}.`);
  return out;
}

/* ── downloads ── */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
export const downloadBytes = (bytes: Uint8Array | ArrayBuffer, name: string, mime = "application/octet-stream") =>
  downloadBlob(new Blob([bytes as BlobPart], { type: mime }), name);

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(2)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

/* ── canvas helpers ── */
export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Canvas export failed"))), type, quality));
}
export function canvasToDataUrl(canvas: HTMLCanvasElement, type = "image/png", quality?: number) {
  return canvas.toDataURL(type, quality);
}

export async function imageToCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bmp.width;
  canvas.height = bmp.height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0);
  bmp.close();
  return canvas;
}

export const dataUrlToBytes = async (dataUrl: string) => new Uint8Array(await (await fetch(dataUrl)).arrayBuffer());

export const baseName = (name: string) => name.replace(/\.[^.]+$/, "");

/* WinAnsi-safe text for pdf-lib standard fonts */
export function sanitizeLatin(s: string): string {
  return s
    .replace(/[‘’‚]/g, "'").replace(/[“”„]/g, '"')
    .replace(/[–—]/g, "-").replace(/…/g, "...").replace(/•/g, "*")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

/* CSV parser (quote-aware, handles embedded commas/newlines) */
export function parseCsvText(s: string): string[][] {
  const rows: string[][] = [];
  let cur = [""];
  let inQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; } else inQ = false; }
      else cur[cur.length - 1] += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") cur.push("");
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; rows.push(cur); cur = [""]; }
    else cur[cur.length - 1] += c;
  }
  if (cur.length > 1 || cur[0] !== "") rows.push(cur);
  return rows;
}
