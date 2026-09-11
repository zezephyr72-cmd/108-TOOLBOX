/* ── File Converters · documents & office formats (12 entries) ─── */
import { useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { PDFDocument } from "pdf-lib";
import PptxGenJS from "pptxgenjs";
import html2canvas from "html2canvas";
import {
  Sheet, Grid3x3, FileSpreadsheet, FileCode, FileUp, Book, BookMarked,
  FileDown, Presentation, FileSignature, FileCheck, Film, Download, RotateCcw, AlertTriangle,
} from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, Err, L, Panel, Seg, Sel, TA } from "../lib/ui";
import {
  loadPdf, renderPage, downloadBlob, downloadBytes, fmtBytes,
  groupLines, linesToRows, pageTextItems, parseCsvText, baseName, sanitizeLatin,
  type PdfDocShim, type TextLine,
} from "../lib/files";
import { tableToPdf, type TableMode } from "../lib/tablepdf";
import { parseRtf, buildDocx, richTextToPdf } from "../lib/rtf";
import { DropZone, DoneNote, Progress, toast } from "../lib/fileui";

/* ── shared bits ── */
function Caveat({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 text-[12.5px] text-amber-300/90 bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3 leading-relaxed">
      <AlertTriangle size={15} className="shrink-0 mt-0.5" /><span>{children}</span>
    </div>
  );
}

function MiniTable({ rows }: { rows: string[][] }) {
  const preview = rows.slice(0, 8).map((r) => r.slice(0, 6));
  return (
    <div className="border border-line rounded-xl overflow-x-auto max-h-56 overflow-y-auto">
      <table className="w-full text-[11.5px] font-mono2">
        <tbody>
          {preview.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 whitespace-nowrap max-w-[180px] truncate ${i === 0 ? "text-acid bg-acid/5" : "text-cream/80"}`}>{c || "·"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 8 && <div className="px-3 py-2 text-[10.5px] font-mono2 text-fog border-t border-line">+ {rows.length - 8} more rows</div>}
    </div>
  );
}

/* shared xlsx/csv → pdf table tool body */
function TableForPdf({ rows, name }: { rows: string[][]; name: string }) {
  const [mode, setMode] = useState<TableMode>("auto");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ pages: number; truncated: boolean; modeUsed: string; colGroups: number } | null>(null);
  const run = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await tableToPdf(rows, mode);
      downloadBytes(res.data, name + ".pdf", "application/pdf");
      setDone({ pages: res.pageCount, truncated: res.truncated, modeUsed: res.modeUsed, colGroups: res.colGroups });
      toast(`Table PDF saved — ${res.pageCount} page${res.pageCount === 1 ? "" : "s"}`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <Panel className="!py-3.5 flex flex-wrap gap-x-6 gap-y-1 font-mono2 text-[12px] text-fog">
        <span><span className="text-acid">{rows.length}</span> rows</span>
        <span><span className="text-acid">{Math.max(...rows.map((r) => r.length))}</span> columns</span>
      </Panel>
      <MiniTable rows={rows} />
      <div>
        <L>Wide-table handling</L>
        <Seg options={[{ v: "auto", label: "Auto" }, { v: "fit", label: "Scale to fit width" }, { v: "multi", label: "Split across pages-wide" }]} value={mode} onChange={setMode} />
      </div>
      {busy ? <Progress pct={0.7} label="Rendering table" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Render as PDF table</Btn>}
      <Err msg={err} />
      {done && !busy && (
        <DoneNote msg={`Downloaded · ${done.pages} pages · ${done.modeUsed === "multi" ? `wide split into ${done.colGroups} column groups` : done.modeUsed === "fit" ? "scaled to fit" : "fit naturally"}${done.truncated ? " · truncated to 4000 rows" : ""}`} />
      )}
    </div>
  );
}

/* ═══ 9 · XLSX → PDF ═══ */
function XlsxToPdf() {
  const [wb, setWb] = useState<XLSX.WorkBook | null>(null);
  const [name, setName] = useState("");
  const [sheet, setSheet] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (fs: File[]) => {
    setErr(null); setWb(null);
    try {
      const data = await fs[0].arrayBuffer();
      const w = XLSX.read(data, { type: "array" });
      setWb(w); setName(baseName(fs[0].name)); setSheet(w.SheetNames[0]);
    } catch { setErr("Couldn't read that spreadsheet — .xlsx and .xls are supported here (save .numbers as .xlsx first)."); }
  };

  if (!wb) return (
    <div className="space-y-4">
      <DropZone accept=".xlsx,.xls,.csv,.ods" onFiles={onFile} title="Drop a spreadsheet here" sub=".xlsx · .xls · .ods" />
      <Err msg={err} />
    </div>
  );
  const rows = (XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: "" }) as unknown[][]).map((r) => r.map((c) => String(c ?? "")));
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{name}</div><div className="text-[11.5px] font-mono2 text-fog">{wb.SheetNames.length} sheet{wb.SheetNames.length === 1 ? "" : "s"}</div></div>
        <Btn v="soft" onClick={() => setWb(null)} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {wb.SheetNames.length > 1 && (
        <div><L>Sheet to export</L><Sel value={sheet} onChange={(e) => setSheet(e.target.value)}>{wb.SheetNames.map((s) => <option key={s}>{s}</option>)}</Sel></div>
      )}
      <TableForPdf rows={rows.filter((r) => r.some((c) => c))} name={`${name}-${sheet}`} />
    </div>
  );
}

/* ═══ 24 · CSV → PDF ═══ */
function CsvToPdf() {
  const [data, setData] = useState<{ rows: string[][]; name: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const onFile = async (fs: File[]) => {
    setErr(null);
    try {
      const rows = parseCsvText(await fs[0].text()).filter((r) => r.some((c) => c.trim()));
      if (!rows.length) throw new Error("That CSV looks empty.");
      setData({ rows, name: baseName(fs[0].name) });
    } catch (e) { setErr((e as Error).message); }
  };
  if (!data) return <div className="space-y-4"><DropZone accept=".csv,.tsv,text/csv" onFiles={onFile} title="Drop a CSV file here" /><Err msg={err} /></div>;
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{data.name}.csv</div></div>
        <Btn v="soft" onClick={() => setData(null)} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      <TableForPdf rows={data.rows} name={data.name} />
    </div>
  );
}

/* ═══ 10 · PDF → Excel ═══ */
function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState<string[][][] | null>(null);

  const run = async (f: File) => {
    setBusy(true); setErr(null); setPct(0);
    try {
      const pdf = await loadPdf(await f.arrayBuffer());
      const per: string[][][] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
        const items = await pageTextItems(await pdf.getPage(i));
        per.push(linesToRows(groupLines(items), 10));
        setPct(i / Math.min(pdf.numPages, 100));
      }
      await pdf.destroy();
      setRowsPerPage(per);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const exportXlsx = async () => {
    if (!rowsPerPage || !file) return;
    const wb = XLSX.utils.book_new();
    rowsPerPage.forEach((rows, i) => {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const widths: { wch: number }[] = [];
      rows.forEach((r) => r.forEach((c, j) => { widths[j] = { wch: Math.min(45, Math.max(widths[j]?.wch || 8, Math.min(45, String(c).length + 2))) }; }));
      ws["!cols"] = widths;
      XLSX.utils.book_append_sheet(wb, ws, rowsPerPage.length === 1 ? "Sheet1" : `Page ${i + 1}`);
    });
    const out = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    downloadBytes(out, baseName(file.name) + ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    toast("Spreadsheet downloaded", "ok");
  };

  if (!file) return (
    <div className="space-y-4">
      <Caveat>Table extraction accuracy depends entirely on how the PDF was built. <strong>Scanned PDFs contain no extractable text</strong> (you'd need OCR first), and complex multi-column layouts may not split cleanly. Check the preview before exporting.</Caveat>
      <DropZone accept=".pdf,application/pdf" onFiles={(fs) => { setFile(fs[0]); run(fs[0]); setRowsPerPage(null); }} title="Drop a table-heavy PDF here" sub="bank statements · reports · price lists" />
      <Err msg={err} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.size)}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setRowsPerPage(null); setErr(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {busy && <Progress pct={pct} label="Reading table structure" />}
      <Err msg={err} />
      {rowsPerPage && !busy && (
        <>
          {rowsPerPage.every((r) => r.length < 2) ? (
            <Caveat>Almost nothing came out — this PDF looks image-based (scanned). Spreadsheets can't be built from pictures of tables without OCR first.</Caveat>
          ) : (
            <>
              <Panel className="!py-3.5 font-mono2 text-[12px] text-fog">
                <span className="text-acid">{rowsPerPage.length}</span> page{rowsPerPage.length === 1 ? "" : "s"} read · <span className="text-acid">{rowsPerPage.reduce((a, r) => a + r.length, 0)}</span> rows detected
              </Panel>
              <MiniTable rows={rowsPerPage[0]} />
              <Btn v="acid" onClick={exportXlsx} className="w-full !py-3.5"><Download size={15} /> Download .xlsx {rowsPerPage.length > 1 ? `(${rowsPerPage.length} sheets)` : ""}</Btn>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ═══ 15 · PDF → HTML ═══ */
function htmlFromLines(allLines: TextLine[], title: string): string {
  const heights = allLines.flatMap((l) => l.cells.map((c) => c.h)).sort((a, b) => a - b);
  const med = heights[Math.floor(heights.length / 2)] || 10;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const parts = allLines.map((line) => {
    const h = Math.max(...line.cells.map((c) => c.h));
    const text = line.cells.map((c) => {
      let s = esc(c.str);
      if (/bold/i.test(c.font)) s = `<strong>${s}</strong>`;
      return s;
    }).join(" ");
    if (!text.trim()) return "";
    if (h > med * 1.75) return `<h1>${text}</h1>`;
    if (h > med * 1.3) return `<h2>${text}</h2>`;
    if (h > med * 1.12) return `<h3>${text}</h3>`;
    return `<p>${text}</p>`;
  }).filter(Boolean).join("\n  ");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 72ch; margin: 0 auto; padding: 48px 24px; line-height: 1.65; color: #1a1a1e; }
  h1 { font-size: 1.7em; margin: 0.9em 0 0.4em; } h2 { font-size: 1.35em; margin: 0.9em 0 0.35em; } h3 { font-size: 1.12em; margin: 0.8em 0 0.3em; }
  p { margin: 0.45em 0; }
</style>
</head>
<body>
  ${parts}
</body>
</html>`;
}
function PdfToHtml() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ html: string; name: string } | null>(null);

  const run = async (f: File) => {
    setBusy(true); setErr(null); setPct(0);
    try {
      const pdf = await loadPdf(await f.arrayBuffer());
      const all: TextLine[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 200); i++) {
        all.push(...groupLines(await pageTextItems(await pdf.getPage(i))));
        setPct(i / Math.min(pdf.numPages, 200));
      }
      await pdf.destroy();
      const html = htmlFromLines(all, baseName(f.name));
      const name = baseName(f.name) + ".html";
      setDone({ html, name });
      downloadBlob(new Blob([html], { type: "text/html" }), name);
      toast("HTML exported", "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file) return (
    <div className="space-y-4">
      <Caveat>This pulls <strong>content structure</strong> (headings, paragraphs, bold text) — it does not clone the page layout. Multi-column designs and heavy graphics won't survive pixel-perfectly. That's the honest trade-off.</Caveat>
      <DropZone accept=".pdf,application/pdf" onFiles={(fs) => { setFile(fs[0]); run(fs[0]); setDone(null); }} title="Drop your PDF here" />
      <Err msg={err} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.size)}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setDone(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {busy && <Progress pct={pct} label="Extracting structure" />}
      <Err msg={err} />
      {done && !busy && (
        <>
          <DoneNote msg={`${done.name} downloaded (${fmtBytes(done.html.length)})`} />
          <div className="flex gap-2">
            <Btn v="soft" onClick={() => window.open(URL.createObjectURL(new Blob([done.html], { type: "text/html" })), "_blank")}>Open preview in new tab</Btn>
            <Btn v="soft" onClick={() => { navigator.clipboard?.writeText(done.html); toast("HTML copied", "ok"); }}>Copy HTML</Btn>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ shared: render HTML → sliced page canvases ═══ */
async function htmlToPageCanvases(html: string, opts: { widthPx: number; pageRatio: number; scale: number; extraCss?: string; onDone?: () => void }): Promise<HTMLCanvasElement[]> {
  const { widthPx, pageRatio, scale } = opts;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-same-origin");
  iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${widthPx}px;height:100px;border:0;visibility:hidden;`;
  iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:#fff}
    body{width:${widthPx}px;font-family:Georgia,serif;color:#18181c;font-size:15px;line-height:1.65;padding:36px 40px;box-sizing:border-box}
    img{max-width:100%;height:auto} h1{font-size:1.7em;margin:0.8em 0 0.4em} h2{font-size:1.35em;margin:0.8em 0 0.35em} h3{font-size:1.12em;margin:0.7em 0 0.3em}
    p{margin:0.5em 0} pre,code{font-family:monospace;font-size:0.88em;background:#f2f2f4;border-radius:4px} pre{padding:12px;white-space:pre-wrap}
    table{border-collapse:collapse;width:100%} td,th{border:1px solid #ccc;padding:4px 8px;text-align:left} a{color:#2456c8}
    ${opts.extraCss || ""}
  </style></head><body>${html}</body></html>`;
  document.body.appendChild(iframe);
  await new Promise((res) => { iframe.onload = res; setTimeout(res, 4000); });
  try { await (iframe.contentDocument as Document).fonts?.ready; } catch { /* ignore */ }
  await new Promise((res) => setTimeout(res, 250));
  const body = iframe.contentDocument!.body;
  const full = await html2canvas(body, { backgroundColor: "#ffffff", scale, logging: false, windowWidth: widthPx + 80, useCORS: true });
  document.body.removeChild(iframe);
  const sliceH = Math.floor(widthPx * pageRatio * scale);
  const pages: HTMLCanvasElement[] = [];
  for (let sy = 0; sy < full.height; sy += sliceH) {
    const c = document.createElement("canvas");
    c.width = full.width; c.height = sliceH;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(full, 0, sy, full.width, Math.min(sliceH, full.height - sy), 0, 0, full.width, Math.min(sliceH, full.height - sy));
    pages.push(c);
  }
  opts.onDone?.();
  return pages;
}

async function canvasesToPdf(pages: HTMLCanvasElement[], widthPx: number, pageRatio: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const wPt = widthPx * 0.75, hPt = widthPx * pageRatio * 0.75;
  for (const c of pages) {
    const png = await (await fetch(c.toDataURL("image/png"))).arrayBuffer();
    const img = await doc.embedPng(png);
    const page = doc.addPage([wPt, hPt]);
    page.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
  }
  return doc.save();
}

/* ═══ 16 · HTML → PDF ═══ */
const RATIOS: Record<string, number> = { A4: 297 / 210, Letter: 11 / 8.5 };
function HtmlToPdf() {
  const [html, setHtml] = useState("<h1>Invoice #1042</h1>\n<p>Billed to <strong>Ada Lovelace</strong></p>\n<table>\n<tr><th>Item</th><th>Price</th></tr>\n<tr><td>Analytical engine tune-up</td><td>£120</td></tr>\n<tr><td>Note G review</td><td>£45</td></tr>\n</table>");
  const [size, setSize] = useState("A4");
  const [scale, setScale] = useState("2");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const run = async () => {
    if (!html.trim()) { setErr("Paste some HTML first."); return; }
    setBusy(true); setErr(null);
    try {
      const widthPx = 794;
      const pages = await htmlToPageCanvases(html, { widthPx, pageRatio: RATIOS[size], scale: +scale });
      const bytes = await canvasesToPdf(pages, widthPx, RATIOS[size]);
      await downloadBytes(bytes, "document.pdf", "application/pdf");
      setDone(pages.length);
      toast(`PDF saved — ${pages.length} page${pages.length === 1 ? "" : "s"}`, "ok");
    } catch (e) { setErr("Couldn\'t render that HTML: " + (e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <TA value={html} onChange={(e) => setHtml(e.target.value)} className="min-h-44" placeholder="<h1>Paste your HTML here…</h1>" />
      <DropZone accept=".html,.htm,text/html" compact title="…or drop an .html file" onFiles={async (fs) => { setHtml(await fs[0].text()); setDone(null); }} />
      <div className="grid grid-cols-2 gap-3">
        <div><L>Page size</L><Seg options={[{ v: "A4", label: "A4" }, { v: "Letter", label: "Letter" }]} value={size} onChange={setSize} /></div>
        <div><L>Sharpness</L><Seg options={[{ v: "1.5", label: "1.5×" }, { v: "2", label: "2×" }, { v: "3", label: "3×" }]} value={scale} onChange={setScale} /></div>
      </div>
      {busy ? <Progress pct={0.65} label="Rendering HTML to pages" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Convert to PDF</Btn>}
      <p className="text-[11.5px] font-mono2 text-fog/70">scripts are stripped for safety · external/cross-origin images may be skipped by the canvas renderer</p>
      <Err msg={err} />
      {done !== null && !busy && <DoneNote msg={`document.pdf downloaded — ${done} page${done === 1 ? "" : "s"}`} />}
    </div>
  );
}

/* ═══ 17 · PDF → EPUB ═══ */
function PdfToEpub() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const run = async (f: File) => {
    setBusy(true); setErr(null); setPct(0);
    try {
      const pdf = await loadPdf(await f.arrayBuffer());
      const pageTexts: string[] = [];
      for (let i = 1; i <= Math.min(pdf.numPages, 150); i++) {
        const lines = groupLines(await pageTextItems(await pdf.getPage(i)));
        pageTexts.push(lines.map((l) => l.cells.map((c) => c.str).join(" ")).filter(Boolean).join("\n"));
        setPct(i / Math.min(pdf.numPages, 150));
      }
      await pdf.destroy();
      const title = baseName(f.name);
      const esc = (s: string) => sanitizeLatin(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
      const CHUNK = 4;
      const chapters: string[] = [];
      for (let i = 0; i < pageTexts.length; i += CHUNK) chapters.push(pageTexts.slice(i, i + CHUNK).join("\n\n"));
      const chapXhtml = (body: string, n: number) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title} — part ${n}</title><link rel="stylesheet" href="style.css"/></head><body>
${body.split(/\n+/).filter((p) => p.trim()).map((p) => `<p>${esc(p)}</p>`).join("\n")}
</body></html>`;
      const zip = new JSZip();
      zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
      zip.folder("META-INF")!.file("container.xml", `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`);
      const oebps = zip.folder("OEBPS")!;
      oebps.file("style.css", "body{font-family:serif;line-height:1.6;margin:1em}p{margin:0.6em 0}");
      chapters.forEach((c, i) => oebps.file(`chapter${i + 1}.xhtml`, chapXhtml(c, i + 1)));
      const uid = "toolbox-" + Date.now().toString(36);
      oebps.file("content.opf", `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${esc(title)}</dc:title><dc:language>en</dc:language><dc:identifier id="uid">${uid}</dc:identifier></metadata>
<manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="style.css" media-type="text/css"/>${chapters.map((_, i) => `<item id="c${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("")}</manifest>
<spine toc="ncx">${chapters.map((_, i) => `<itemref idref="c${i + 1}"/>`).join("")}</spine>
</package>`);
      oebps.file("toc.ncx", `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="${uid}"/></head><docTitle><text>${esc(title)}</text></docTitle>
<navMap>${chapters.map((_, i) => `<navPoint id="n${i + 1}" playOrder="${i + 1}"><navLabel><text>Pages ${i * CHUNK + 1}–${Math.min((i + 1) * CHUNK, pageTexts.length)}</text></navLabel><content src="chapter${i + 1}.xhtml"/></navPoint>`).join("")}</navMap></ncx>`);
      const blob = await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" });
      downloadBlob(blob, title + ".epub");
      setDone(chapters.length);
      toast("EPUB downloaded", "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file) return (
    <div className="space-y-4">
      <Caveat>This <strong>reflows text</strong> into an e-reader format — it does not (and an EPUB fundamentally cannot) preserve exact page layout, fonts, or graphics. Works beautifully on text-first PDFs like reports and manuscripts.</Caveat>
      <DropZone accept=".pdf,application/pdf" onFiles={(fs) => { setFile(fs[0]); run(fs[0]); setDone(null); }} title="Drop a text-based PDF here" sub="ebooks · reports · long documents" />
      <Err msg={err} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setDone(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {busy && <Progress pct={pct} label="Extracting chapters" />}
      <Err msg={err} />
      {done !== null && !busy && <DoneNote msg={`EPUB downloaded — ${done} chapters, works in Apple Books / Kindle (send-to-kindle) / Kobo`} />}
    </div>
  );
}

/* ═══ 18 · EPUB → PDF ═══ */
function EpubToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState("Parsing EPUB");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const run = async (f: File) => {
    setBusy(true); setErr(null); setPct(0);
    const objectUrls: string[] = [];
    try {
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const container = await zip.file("META-INF/container.xml")?.async("string");
      if (!container) throw new Error("Not a valid EPUB (missing container.xml).");
      const rootPath = /full-path="([^"]+)"/.exec(container)?.[1];
      if (!rootPath) throw new Error("Couldn't locate the EPUB's OPF manifest.");
      const opfText = await zip.file(rootPath)!.async("string");
      const opfDir = rootPath.includes("/") ? rootPath.slice(0, rootPath.lastIndexOf("/") + 1) : "";
      const doc = new DOMParser().parseFromString(opfText, "text/xml");
      const manifest = new Map<string, { href: string; type: string }>();
      doc.getElementsByTagNameNS ? Array.from(doc.getElementsByTagNameNS("*", "item")).forEach((it) => {
        const id = it.getAttribute("id"), href = it.getAttribute("href");
        if (id && href) manifest.set(id, { href, type: it.getAttribute("media-type") || "" });
      }) : [];
      const spine: string[] = [];
      Array.from(doc.getElementsByTagNameNS("*", "itemref")).forEach((ir) => { const id = ir.getAttribute("idref"); if (id) spine.push(id); });
      const title = doc.getElementsByTagNameNS("*", "title")[0]?.textContent || baseName(f.name);
      if (!spine.length) throw new Error("This EPUB has no readable spine items.");

      // pre-build image blob URLs
      const urlByPath = new Map<string, string>();
      for (const { href, type } of manifest.values()) {
        if (!type.startsWith("image/")) continue;
        const path = opfDir + href;
        const entry = zip.file(path);
        if (entry) {
          const blob = await entry.async("blob");
          const url = URL.createObjectURL(new Blob([blob], { type }));
          objectUrls.push(url); urlByPath.set(path, url); urlByPath.set(href, url);
        }
      }

      const widthPx = 794, ratio = 297 / 210;
      const pdfPages: HTMLCanvasElement[] = [];
      const items = spine.slice(0, 40);
      for (let i = 0; i < items.length; i++) {
        const it = manifest.get(items[i]);
        if (!it) continue;
        setStage(`Rendering section ${i + 1} / ${items.length}`);
        let html = await zip.file(opfDir + it.href)!.async("string");
        html = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<link[^>]*>/gi, "");
        // resolve image srcs relative to the item directory
        const itemDir = (opfDir + it.href).slice(0, (opfDir + it.href).lastIndexOf("/") + 1);
        html = html.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (_m, pre, src, post) => {
          const clean = src.replace(/^\.\//, "");
          const abs1 = itemDir + clean;
          const abs2 = opfDir + clean;
          const url = urlByPath.get(abs1) || urlByPath.get(abs2) || urlByPath.get(src) || urlByPath.get(clean);
          return url ? pre + url + post : pre + "" + post;
        });
        const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
        const bodyHtml = bodyMatch ? bodyMatch[1] : html;
        const pages = await htmlToPageCanvases(bodyHtml, { widthPx, pageRatio: ratio, scale: 1.6 });
        pdfPages.push(...pages);
        setPct((i + 1) / items.length);
      }
      const bytes = await canvasesToPdf(pdfPages, widthPx, ratio);
      downloadBytes(bytes, title + ".pdf", "application/pdf");
      setDone(pdfPages.length);
      toast(`PDF saved — ${pdfPages.length} pages`, "ok");
    } catch (e) { setErr((e as Error).message); }
    finally { objectUrls.forEach((u) => URL.revokeObjectURL(u)); }
    setBusy(false);
  };

  if (!file) return (
    <div className="space-y-4">
      <Caveat>Chapters are re-typeset (serif, comfortable margins) rather than pixel-reproduced — embedded images are preserved when present. Styling from the EPUB's own CSS is simplified.</Caveat>
      <DropZone accept=".epub,application/epub+zip" onFiles={(fs) => { setFile(fs[0]); run(fs[0]); setDone(null); }} title="Drop an .epub ebook here" />
      <Err msg={err} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.size)}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setDone(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {busy && <Progress pct={pct} label={stage} />}
      <Err msg={err} />
      {done !== null && !busy && <DoneNote msg={`PDF downloaded — ${done} pages`} />}
    </div>
  );
}

/* ═══ 7 · PPTX → PDF (simplified client render) ═══ */
const EMU_PER_PX = 914400 / 144; // render at 144dpi (2x)
function PptxToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const run = async (f: File) => {
    setBusy(true); setErr(null); setPct(0);
    try {
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const presXml = await zip.file("ppt/presentation.xml")?.async("string");
      if (!presXml) throw new Error("Old binary .ppt format isn't supported — open it in PowerPoint/Keynote and re-save as .pptx first.");
      const pres = new DOMParser().parseFromString(presXml, "text/xml");
      const sldSz = pres.getElementsByTagNameNS("*", "sldSz")[0];
      const cx = +(sldSz?.getAttribute("cx") || 12192000), cy = +(sldSz?.getAttribute("cy") || 6858000);
      const W = Math.round(cx / EMU_PER_PX), H = Math.round(cy / EMU_PER_PX);

      const slideNames = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a, b) => +(a.match(/\d+/)![0]) - +(b.match(/\d+/)![0]));
      if (!slideNames.length) throw new Error("No slides found in this presentation.");
      const S = slideNames.slice(0, 100);

      const out = await PDFDocument.create();
      const parser = new DOMParser();

      for (let si = 0; si < S.length; si++) {
        const slideDoc = parser.parseFromString(await zip.file(S[si])!.async("string"), "text/xml");
        const relsPath = S[si].replace("slides/", "slides/_rels/") + ".rels";
        const rels = new Map<string, string>();
        if (zip.file(relsPath)) {
          const relDoc = parser.parseFromString(await zip.file(relsPath)!.async("string"), "text/xml");
          Array.from(relDoc.getElementsByTagNameNS("*", "Relationship")).forEach((r) => {
            const id = r.getAttribute("Id"), t = r.getAttribute("Target");
            if (id && t) rels.set(id, t.replace(/^\.\.\//, "ppt/"));
          });
        }

        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);

        const TREE_SEL = "spTree";
        const tree = slideDoc.getElementsByTagNameNS("*", TREE_SEL)[0];
        if (tree) {
          for (const el of Array.from(tree.children)) {
            const tag = el.localName;
            if (tag === "sp") {
              // text box
              const off = el.getElementsByTagNameNS("*", "off")[0];
              const ext = el.getElementsByTagNameNS("*", "ext")[0];
              const bx = off ? +off.getAttribute("x")! / EMU_PER_PX : W * 0.08;
              const by = off ? +off.getAttribute("y")! / EMU_PER_PX : H * 0.08;
              const bw = ext ? +ext.getAttribute("cx")! / EMU_PER_PX : W * 0.84;
              const bh = ext ? +ext.getAttribute("cy")! / EMU_PER_PX : H * 0.2;
              const paras = Array.from(el.getElementsByTagNameNS("*", "p"));
              let ty = by;
              for (const p of paras) {
                const text = Array.from(p.getElementsByTagNameNS("*", "t")).map((t) => t.textContent || "").join("");
                if (!text.trim()) { ty += 10; continue; }
                const rPr = p.getElementsByTagNameNS("*", "rPr")[0] || p.getElementsByTagNameNS("*", "defRPr")[0];
                const pt = rPr?.getAttribute("sz") ? +rPr.getAttribute("sz")! / 100 : 18;
                const fsPx = pt * (144 / 72);
                const clr = rPr?.getElementsByTagNameNS("*", "srgbClr")[0]?.getAttribute("val");
                const bold = rPr?.getAttribute("b") === "1";
                ctx.fillStyle = clr ? `#${clr}` : "#1a1a1e";
                ctx.font = `${bold ? "700" : "400"} ${fsPx}px Arial, Helvetica, sans-serif`;
                // word wrap within box width
                const words = text.split(/\s+/);
                let line = "";
                const lines: string[] = [];
                for (const w of words) {
                  const test = line ? line + " " + w : w;
                  if (ctx.measureText(test).width > bw && line) { lines.push(line); line = w; } else line = test;
                }
                if (line) lines.push(line);
                for (const l of lines) {
                  if (ty + fsPx > by + bh + fsPx) break;
                  ctx.fillText(l, bx, ty + fsPx);
                  ty += fsPx * 1.22;
                }
              }
            } else if (tag === "pic") {
              const blip = el.getElementsByTagNameNS("*", "blip")[0];
              const rid = blip?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "embed") || blip?.getAttribute("r:embed");
              const target = rid ? rels.get(rid) : null;
              const mediaFile = target ? zip.file(target) : null;
              if (mediaFile) {
                try {
                  const blob = await mediaFile.async("blob");
                  const bmp = await createImageBitmap(blob);
                  const off = el.getElementsByTagNameNS("*", "off")[0];
                  const ext = el.getElementsByTagNameNS("*", "ext")[0];
                  const bx = off ? +off.getAttribute("x")! / EMU_PER_PX : 0;
                  const by = off ? +off.getAttribute("y")! / EMU_PER_PX : 0;
                  const bw = ext ? +ext.getAttribute("cx")! / EMU_PER_PX : bmp.width;
                  const bh = ext ? +ext.getAttribute("cy")! / EMU_PER_PX : bmp.height;
                  ctx.drawImage(bmp, bx, by, bw, bh);
                  bmp.close();
                } catch { /* undecodable image — skip */ }
              }
            }
          }
        }

        const png = await (await fetch(canvas.toDataURL("image/jpeg", 0.92))).arrayBuffer();
        const img = await out.embedJpg(png);
        const wPt = (cx / 914400) * 72, hPt = (cy / 914400) * 72;
        const page = out.addPage([wPt, hPt]);
        page.drawImage(img, { x: 0, y: 0, width: wPt, height: hPt });
        setPct((si + 1) / S.length);
      }
      const bytes = await out.save();
      downloadBytes(bytes, baseName(f.name) + ".pdf", "application/pdf");
      setDone(S.length);
      toast(`PDF saved — ${S.length} slides`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file) return (
    <div className="space-y-4">
      <Caveat><strong>Honest expectations:</strong> this renders a readable approximation — slide text and images extracted and positioned on each page. Master themes, gradients, SmartArt, charts, videos and animations do not survive a fully-browser-side render. Everything stays on your device, which is the trade.</Caveat>
      <DropZone accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation" onFiles={(fs) => { setFile(fs[0]); run(fs[0]); setDone(null); }} title="Drop a .pptx presentation here" />
      <Err msg={err} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.size)}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setDone(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {busy && <Progress pct={pct} label="Rendering slides" />}
      <Err msg={err} />
      {done !== null && !busy && <DoneNote msg={`PDF downloaded — ${done} slides rendered`} />}
    </div>
  );
}

/* ═══ 8 · PDF → PPTX ═══ */
function PdfToPptx() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PdfDocShim | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (fs: File[]) => {
    setErr(null); setPdf(null);
    try { const d = await loadPdf(await fs[0].arrayBuffer()); setFile(fs[0]); setPdf(d); }
    catch (e) { setErr((e as Error).message); }
  };

  const run = async () => {
    if (!pdf || !file) return;
    setBusy(true); setErr(null); setPct(0);
    try {
      const pptx = new PptxGenJS();
      const first = await pdf.getPage(1);
      const vp = first.getViewport({ scale: 1 });
      const wIn = vp.width / 72, hIn = vp.height / 72;
      pptx.defineLayout({ name: "PDFPAGE", width: wIn, height: hIn });
      pptx.layout = "PDFPAGE";
      pptx.title = baseName(file.name);
      const canvas = document.createElement("canvas");
      const n = Math.min(pdf.numPages, 60);
      for (let i = 1; i <= n; i++) {
        await renderPage(await pdf.getPage(i), canvas, 2);
        const slide = pptx.addSlide();
        slide.addImage({ data: canvas.toDataURL("image/jpeg", 0.9), x: 0, y: 0, w: wIn, h: hIn });
        setPct(i / n);
      }
      await pptx.writeFile({ fileName: baseName(file.name) + ".pptx" });
      toast(`PPTX saved — ${n} slides`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <>
          <Caveat>Each PDF page becomes a <strong>full-bleed image slide</strong> — text is not converted into editable PowerPoint text boxes. It opens in PowerPoint, Keynote and Google Slides.</Caveat>
          <DropZone accept=".pdf,application/pdf" onFiles={onFile} title="Drop your PDF here" sub="up to 60 pages" />
          <Err msg={err} />
        </>
      ) : (
        <>
          <Panel className="flex items-center justify-between gap-3 !py-4">
            <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{pdf?.numPages} pages · {fmtBytes(file.size)}</div></div>
            <Btn v="soft" onClick={() => { pdf?.destroy(); setFile(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
          </Panel>
          {busy ? <Progress pct={pct} label="Building slides" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Convert to PPTX</Btn>}
        </>
      )}
      <Err msg={err} />
    </div>
  );
}

/* ═══ 25 · RTF → PDF / DOCX ═══ */
function RtfConvert({ out }: { out: "pdf" | "docx" }) {
  const [file, setFile] = useState<File | null>(null);
  const [sample, setSample] = useState<{ paras: number; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const rtfRef = useRef<string>("");

  const onFile = async (fs: File[]) => {
    setErr(null); setSample(null);
    try {
      const raw = await fs[0].text();
      if (!raw.trimStart().startsWith("{\\rtf")) throw new Error("That doesn't look like an RTF document (missing {\\rtf header).");
      rtfRef.current = raw;
      const paras = parseRtf(raw);
      if (!paras.length) throw new Error("No readable text found in this RTF file.");
      setFile(fs[0]);
      setSample({ paras: paras.length, preview: paras.map((p) => p.runs.map((r) => r.t).join("")).join("\n").slice(0, 400) });
    } catch (e) { setErr((e as Error).message); }
  };

  const run = async () => {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const paras = parseRtf(rtfRef.current);
      if (out === "pdf") {
        const bytes = await richTextToPdf(paras, { pageWH: [595.28, 841.89] });
        downloadBytes(bytes, baseName(file.name) + ".pdf", "application/pdf");
      } else {
        downloadBlob(await buildDocx(paras), baseName(file.name) + ".docx");
      }
      toast(`${out.toUpperCase()} downloaded`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file || !sample) return (
    <div className="space-y-4">
      <DropZone accept=".rtf,application/rtf,text/rtf" onFiles={onFile} title="Drop an .rtf document here" sub="bold · italic · underline · font sizes survive the trip" />
      <Err msg={err} />
    </div>
  );
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{sample.paras} paragraphs parsed</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setSample(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      <Panel><div className="text-[11px] font-mono2 uppercase tracking-widest text-fog mb-2">Preview</div><p className="text-[13px] text-cream/80 whitespace-pre-wrap leading-relaxed">{sample.preview}{sample.preview.length >= 400 ? "…" : ""}</p></Panel>
      {busy ? <Progress pct={0.7} label={`Building ${out.toUpperCase()}`} /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Convert to {out === "pdf" ? "PDF" : "Word (.docx)"}</Btn>}
      <Err msg={err} />
    </div>
  );
}

/* ═══ 12 · GIF ↔ MP4 — honest coming-soon ═══ */
function GifVideoSoon() {
  return (
    <div className="space-y-5">
      <Panel className="text-center !py-12">
        <span className="mx-auto w-14 h-14 grid place-items-center rounded-2xl bg-panel2 border border-line text-acid"><Film size={24} /></span>
        <h3 className="mt-5 text-2xl font-bold tracking-tight">Coming soon</h3>
        <p className="mt-3 max-w-md mx-auto text-[13.5px] leading-relaxed text-fog">
          Doing GIF ↔ MP4 conversion well requires <span className="text-cream font-mono2">ffmpeg.wasm</span> — a ~30 MB, multi-file runtime that conflicts with this site's "everything fast, single-page, on-device" promise. We'd rather ship it right than ship it slow. It's on the roadmap.
        </p>
      </Panel>
      <p className="text-center text-[12.5px] text-fog">Meanwhile, these already work:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {[["pdf-to-jpeg", "PDF → JPEG"], ["webp-to-jpeg", "WebP → JPEG"], ["jpeg-to-webp", "JPEG → WebP"]].map(([id, n]) => (
          <Link key={id} to={`/tool/${id}`} className="text-[12.5px] px-4 py-2 rounded-full border border-line text-fog hover:text-ink hover:bg-acid hover:border-acid transition-all">{n}</Link>
        ))}
      </div>
    </div>
  );
}

export const fileDocTools: ToolDef[] = [
  { id: "xlsx-to-pdf", name: "Excel to PDF", desc: "Render .xlsx sheets into a clean PDF table with fit-vs-split width control.", category: "file", icon: Sheet, keywords: ["excel to pdf", "xlsx to pdf", "spreadsheet pdf"], processing: "client", related: ["csv-to-pdf", "pdf-to-excel", "text-to-pdf"], Component: XlsxToPdf },
  { id: "csv-to-pdf", name: "CSV to PDF", desc: "Comma-separated data in, beautifully grid-lined PDF table out.", category: "file", icon: FileSpreadsheet, keywords: ["csv to pdf", "data table pdf", "csv print"], processing: "client", related: ["xlsx-to-pdf", "text-to-pdf", "rtf-to-pdf"], Component: CsvToPdf },
  { id: "pdf-to-excel", name: "PDF to Excel", desc: "Extract table rows from PDFs into a real .xlsx — one sheet per page.", category: "file", icon: Grid3x3, keywords: ["pdf to xlsx", "pdf table to excel", "bank statement to excel"], processing: "client", featured: true, related: ["pdf-to-text", "xlsx-to-pdf", "pdf-to-html"], Component: PdfToExcel },
  { id: "pdf-to-html", name: "PDF to HTML", desc: "Convert a PDF's headings and paragraphs into clean, semantic HTML.", category: "file", icon: FileCode, keywords: ["pdf to html", "pdf to webpage", "extract pdf content"], processing: "client", related: ["html-to-pdf", "pdf-to-epub", "pdf-to-text"], Component: PdfToHtml },
  { id: "html-to-pdf", name: "HTML to PDF", desc: "Paste markup, get a sharp rendered PDF — scripts stripped for safety.", category: "file", icon: FileUp, keywords: ["html to pdf", "webpage to pdf", "save html as pdf", "invoice html pdf"], processing: "client", related: ["pdf-to-html", "epub-to-pdf", "text-to-pdf"], Component: HtmlToPdf },
  { id: "pdf-to-epub", name: "PDF to EPUB", desc: "Reflow text-heavy PDFs into proper e-reader format with chapters.", category: "file", icon: Book, keywords: ["pdf to ebook", "pdf to kindle", "make epub"], processing: "client", related: ["epub-to-pdf", "pdf-to-html", "pdf-to-text"], Component: PdfToEpub },
  { id: "epub-to-pdf", name: "EPUB to PDF", desc: "Read any ebook as a PDF — sections typeset into clean pages.", category: "file", icon: BookMarked, keywords: ["epub to pdf", "ebook to pdf", "kindle book pdf"], processing: "client", featured: true, related: ["pdf-to-epub", "html-to-pdf", "rtf-to-pdf"], Component: EpubToPdf },
  { id: "pptx-to-pdf", name: "PowerPoint to PDF", desc: "Browser-side slide render: text and images placed per slide — layout approximated, privacy absolute.", category: "file", icon: FileDown, keywords: ["pptx to pdf", "powerpoint to pdf", "presentation to pdf", "slides pdf"], processing: "client", related: ["pdf-to-pptx", "epub-to-pdf", "html-to-pdf"], Component: PptxToPdf },
  { id: "pdf-to-pptx", name: "PDF to PowerPoint", desc: "Every PDF page becomes a full-bleed slide in a real .pptx file.", category: "file", icon: Presentation, keywords: ["pdf to pptx", "pdf to powerpoint", "pdf to slides"], processing: "client", related: ["pptx-to-pdf", "pdf-to-jpeg", "pdf-page-extractor"], Component: PdfToPptx },
  { id: "rtf-to-pdf", name: "RTF to PDF", desc: "Classic rich-text documents converted with bold/italic/sizes intact.", category: "file", icon: FileSignature, keywords: ["rtf to pdf", "rich text pdf", "wordpad to pdf"], processing: "client", related: ["rtf-to-word", "text-to-pdf", "html-to-pdf"], Component: () => <RtfConvert out="pdf" /> },
  { id: "rtf-to-word", name: "RTF to Word (.docx)", desc: "Transform legacy RTF into a genuine, openable .docx package.", category: "file", icon: FileCheck, keywords: ["rtf to docx", "rich text to word", "convert rtf office"], processing: "client", related: ["rtf-to-pdf", "pdf-to-epub", "text-to-pdf"], Component: () => <RtfConvert out="docx" /> },
  { id: "gif-video-converter", name: "GIF ↔ MP4 Converter", desc: "Animated GIF ⇄ video conversion. Coming soon — we're not shipping it until it's fast.", category: "file", icon: Film, keywords: ["gif to mp4", "mp4 to gif", "video to gif", "gif converter"], processing: "client", soon: true, related: ["pdf-to-jpeg", "webp-to-jpeg", "jpeg-to-webp"], Component: GifVideoSoon },
];
