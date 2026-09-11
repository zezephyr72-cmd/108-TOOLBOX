/* Minimal-but-honest RTF parser → styled runs/paragraphs,
   plus DOCX builder (real .docx zip) and rich-text PDF renderer. */
import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { sanitizeLatin } from "./files";

export interface RtfRun { t: string; b: boolean; i: boolean; u: boolean; fs: number }
export interface RtfPara { runs: RtfRun[] }

const SKIP_DESTS = new Set(["fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "datastore", "themedata", "xmlnstbl", "latentstyles", "generator", "*"]);

export function parseRtf(src: string): RtfPara[] {
  const paras: RtfPara[] = [{ runs: [] }];
  let depth = 0;
  let skipAt = -1; // depth at which skipping started
  const style = { b: false, i: false, u: false, fs: 22 }; // fs in half-points
  const styleStack: typeof style[] = [];
  let buf = "";

  const flush = () => {
    if (!buf) return;
    paras[paras.length - 1].runs.push({ t: buf, b: style.b, i: style.i, u: style.u, fs: style.fs / 2 });
    buf = "";
  };
  const newPara = () => {
    flush();
    if (paras[paras.length - 1].runs.length) paras.push({ runs: [] });
  };

  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === "{") {
      depth++;
      styleStack.push({ ...style });
      if (skipAt < 0) {
        // peek: is this a skippable destination? "{\fonttbl" or "{\*"
        const m = src.slice(i + 1, i + 30).match(/^\\(\*|[a-z]+)/);
        if (m && (SKIP_DESTS.has(m[1]) || m[1] === "*")) skipAt = depth;
      }
      i++;
      continue;
    }
    if (c === "}") {
      flush();
      depth--;
      const prev = styleStack.pop();
      if (prev) Object.assign(style, prev);
      if (skipAt === depth + 1) skipAt = -1;
      i++;
      continue;
    }
    if (skipAt > 0) { i++; continue; }

    if (c === "\\") {
      // control word / symbol
      if (src[i + 1] === "\\" || src[i + 1] === "{" || src[i + 1] === "}") { buf += src[i + 1]; i += 2; continue; }
      if (src[i + 1] === "'") {
        const hh = src.slice(i + 2, i + 4);
        if (/^[0-9a-fA-F]{2}$/.test(hh)) buf += String.fromCharCode(parseInt(hh, 16));
        i += 4;
        continue;
      }
      if (src[i + 1] === "\n" || src[i + 1] === "\r") { i += 2; continue; }
      const m = src.slice(i + 1, i + 33).match(/^([a-z]+)(-?\d+) ?/);
      if (!m) { // control symbol like \~ \- \_
        const sym = src[i + 1];
        if (sym === "~") buf += " ";
        else if (sym === "_") buf += "‑";
        else if (sym === "-") buf += "";
        else if (sym === "*") skipAt = depth + 1;
        i += 2;
        continue;
      }
      const word = m[1], arg = m[2] !== undefined ? parseInt(m[2]) : null;
      i += 1 + m[0].length;
      switch (word) {
        case "par": case "line": case "row": newPara(); break;
        case "pard": flush(); style.b = style.i = style.u = false; style.fs = 22; break;
        case "b": style.b = arg !== 0; break;
        case "i": style.i = arg !== 0; break;
        case "ul": style.u = arg !== 0; break;
        case "ulnone": style.u = false; break;
        case "fs": if (arg) style.fs = arg; break;
        case "plain": flush(); style.b = style.i = style.u = false; style.fs = 22; break;
        case "tab": buf += "    "; break;
        case "emdash": buf += "—"; break;
        case "endash": buf += "–"; break;
        case "bullet": buf += "•"; break;
        case "lquote": buf += "'"; break;
        case "rquote": buf += "'"; break;
        case "ldblquote": buf += '"'; break;
        case "rdblquote": buf += '"'; break;
        case "u": {
          if (arg !== null) {
            buf += String.fromCodePoint(arg < 0 ? arg + 65536 : arg);
            // consume fallback: next token may be \'xx or a raw char
            if (src[i] === "\\" && src[i + 1] === "'") i += 4;
            else if (src[i] === "?") i++;
          }
          break;
        }
        default: break; // ignore formatting metadata we don't model
      }
      continue;
    }
    if (c === "\n" || c === "\r") { i++; continue; }
    buf += c;
    i++;
  }
  flush();
  return paras.filter((p) => p.runs.length && p.runs.some((r) => r.t.trim()));
}

/* ── DOCX builder ── */
const xesc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function buildDocx(paras: RtfPara[]): Promise<Blob> {
  const body = paras.map((p) => {
    const runs = p.runs.map((r) => {
      const props: string[] = [];
      if (r.b) props.push("<w:b/>");
      if (r.i) props.push("<w:i/>");
      if (r.u) props.push('<w:u w:val="single"/>');
      if (r.fs && r.fs !== 11) props.push(`<w:sz w:val="${Math.round(r.fs * 2)}"/>`);
      return `<w:r>${props.length ? `<w:rPr>${props.join("")}</w:rPr>` : ""}<w:t xml:space="preserve">${xesc(r.t)}</w:t></w:r>`;
    }).join("");
    return `<w:p>${runs}</w:p>`;
  }).join("");

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>`;

  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels")!.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder("word")!.file("document.xml", documentXml);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/* ── rich text → PDF (word-flow with per-word fonts) ── */
export async function richTextToPdf(paras: RtfPara[], opts: { pageWH: [number, number]; margin?: number; baseFs?: number }): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ital = await doc.embedFont(StandardFonts.HelveticaOblique);
  const boldItal = await doc.embedFont(StandardFonts.HelveticaBoldOblique);
  const fontFor = (b: boolean, i: boolean): PDFFont => (b && i ? boldItal : b ? bold : i ? ital : reg);

  const [PW, PH] = opts.pageWH;
  const M = opts.margin ?? 56;
  const baseFs = opts.baseFs ?? 11;
  const ink = rgb(0.12, 0.12, 0.14);

  let page = doc.addPage([PW, PH]);
  let y = PH - M;
  let pageCount = 1;

  for (const para of paras) {
    // tokenize into styled words
    const words: { t: string; f: PDFFont; fs: number; u: boolean }[] = [];
    for (const run of para.runs) {
      const fs = Math.min(36, Math.max(7, run.fs || baseFs));
      const f = fontFor(run.b, run.i);
      for (const w of sanitizeLatin(run.t).split(/\s+/)) {
        if (w) words.push({ t: w, f, fs, u: run.u });
      }
    }
    if (!words.length) { y -= baseFs * 0.8; continue; }

    interface Part { t: string; f: PDFFont; fs: number; u: boolean }
    let line: Part[] = [];
    let lineW = 0;
    let lineFs = baseFs;
    const maxW = PW - M * 2;

    const emitLine = () => {
      if (!line.length) return;
      lineFs = Math.max(...line.map((p) => p.fs));
      if (y - lineFs * 1.3 < M) { page = doc.addPage([PW, PH]); y = PH - M; pageCount++; }
      let x = M;
      for (const p of line) {
        page.drawText(p.t, { x, y: y - p.fs, size: p.fs, font: p.f, color: ink });
        const w = p.f.widthOfTextAtSize(p.t, p.fs);
        if (p.u) page.drawLine({ start: { x, y: y - p.fs - 1.5 }, end: { x: x + w, y: y - p.fs - 1.5 }, thickness: 0.6, color: ink });
        x += w + p.f.widthOfTextAtSize(" ", p.fs);
      }
      y -= lineFs * 1.35;
      line = [];
      lineW = 0;
    };

    for (const w of words) {
      const ww = w.f.widthOfTextAtSize(w.t, w.fs) + w.f.widthOfTextAtSize(" ", w.fs);
      if (lineW + ww > maxW && line.length) emitLine();
      line.push(w);
      lineW += ww;
    }
    emitLine();
    y -= baseFs * 0.5;
  }

  // page numbers
  const allPages = doc.getPages();
  allPages.forEach((p, idx) => {
    p.drawText(`${idx + 1} / ${allPages.length}`, { x: PW / 2 - 14, y: M / 2, size: 7.5, font: reg, color: rgb(0.55, 0.55, 0.57) });
  });
  void pageCount;
  return doc.save();
}
