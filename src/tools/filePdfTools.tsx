/* ── File Converters · pure-PDF tools (7 entries) ──────────────── */
import { useRef, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PenLine, FileText, Scissors, Info, Stamp, Droplet, Crop, Download, RotateCcw, AlertTriangle } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, Err, L, Panel, Row, Sel, TA } from "../lib/ui";
import {
  loadPdf, renderPage, parsePageRanges, downloadBlob, downloadBytes, fmtBytes,
  groupLines, pageTextItems, baseName, sanitizeLatin, type PdfDocShim,
} from "../lib/files";
import { DropZone, DoneNote, Progress, toast } from "../lib/fileui";

const PAGES: Record<string, [number, number]> = { A4: [595.28, 841.89], Letter: [612, 792], Legal: [612, 1008] };

/* ═══ 14 · Text → PDF ═══ */
function TextToPdf() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [size, setSize] = useState("A4");
  const [fs, setFs] = useState(12);
  const [margin, setMargin] = useState("20");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [doneSize, setDoneSize] = useState<number | null>(null);

  const content = file ? "" : text;

  const run = async () => {
    setBusy(true); setErr(null);
    try {
      const raw = file ? await file.text() : content;
      if (!raw.trim()) throw new Error("Give me some text first — paste it or upload a .txt file.");
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const [PW, PH] = PAGES[size];
      const M = +margin * 2.835;
      const lineH = fs * 1.45;
      const maxW = PW - M * 2;
      // pre-wrap
      const wrapped: string[] = [];
      for (const logical of sanitizeLatin(raw).split("\n")) {
        if (!logical) { wrapped.push(""); continue; }
        let line = "";
        for (const word of logical.split(" ")) {
          const test = line ? line + " " + word : word;
          if (font.widthOfTextAtSize(test, fs) > maxW && line) { wrapped.push(line); line = word; }
          else line = test;
        }
        wrapped.push(line);
      }
      let page = doc.addPage([PW, PH]);
      let y = PH - M - fs;
      for (const line of wrapped) {
        if (y < M + lineH) { page = doc.addPage([PW, PH]); y = PH - M - fs; }
        if (line) page.drawText(line, { x: M, y, size: fs, font, color: rgb(0.11, 0.11, 0.13) });
        y -= lineH;
      }
      doc.setTitle(baseName(file?.name || "document"));
      doc.setProducer("Toolbox — text to pdf");
      const bytes = await doc.save();
      setDoneSize(bytes.length);
      downloadBytes(bytes, (file ? baseName(file.name) : "document") + ".pdf", "application/pdf");
      toast(`PDF created — ${doc.getPageCount()} page${doc.getPageCount() === 1 ? "" : "s"}`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {file ? (
        <Panel className="flex items-center justify-between gap-3 !py-4">
          <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.size)}</div></div>
          <Btn v="soft" onClick={() => setFile(null)} className="shrink-0"><RotateCcw size={13} /> Paste instead</Btn>
        </Panel>
      ) : (
        <>
          <TA value={text} onChange={(e) => { setText(e.target.value); setDoneSize(null); }} placeholder="Paste or type your text here…" className="min-h-44" />
          <DropZone accept=".txt,.md,text/plain,text/markdown" onFiles={(fs) => setFile(fs[0])} compact title="…or drop a .txt / .md file" />
        </>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div><L>Page size</L><Sel value={size} onChange={(e) => setSize(e.target.value)}>{Object.keys(PAGES).map((p) => <option key={p}>{p}</option>)}</Sel></div>
        <div><L hint={`${fs}pt`}>Font size</L><input type="range" className="slider mt-4" min={8} max={20} value={fs} onChange={(e) => setFs(+e.target.value)} /></div>
        <div><L>Margins</L><Sel value={margin} onChange={(e) => setMargin(e.target.value)}>{[["12", "Narrow · 12mm"], ["20", "Normal · 20mm"], ["28", "Wide · 28mm"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Sel></div>
      </div>
      {busy ? <Progress pct={0.6} label="Typesetting" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Generate PDF</Btn>}
      <Err msg={err} />
      {doneSize !== null && !busy && <DoneNote msg={`PDF downloaded (${fmtBytes(doneSize)}) — emojis & exotic glyphs are replaced (built-in PDF fonts are Latin-only)`} />}
    </div>
  );
}

/* ═══ 13 · PDF → Text ═══ */
function PdfToText() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ text: string; chars: number; pages: number } | null>(null);

  const run = async (f: File) => {
    setBusy(true); setErr(null); setPct(0);
    try {
      const pdf = await loadPdf(await f.arrayBuffer());
      let all = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const items = await pageTextItems(await pdf.getPage(i));
        const lines = groupLines(items);
        all += lines.map((l) => l.cells.map((c) => c.str).join(" ")).join("\n") + "\n\n";
        setPct(i / pdf.numPages);
      }
      await pdf.destroy();
      setResult({ text: all.trim(), chars: all.trim().length, pages: pdf.numPages });
      if (all.trim()) downloadBlob(new Blob([all.trim()], { type: "text/plain" }), baseName(f.name) + ".txt");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file) return <DropZone accept=".pdf,application/pdf" onFiles={(fs) => { setFile(fs[0]); run(fs[0]); }} title="Drop your PDF here" sub="text extraction runs locally" />;
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.size)}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setResult(null); setErr(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {busy && <Progress pct={pct} label="Extracting text" />}
      <Err msg={err} />
      {result && !busy && (
        <>
          {result.chars === 0 || result.chars < result.pages * 12 ? (
            <div className="flex gap-3 text-[12.5px] text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-xl px-4 py-3.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>Almost no text came out of this PDF — it's very likely <strong>scanned/image-based</strong>. Text extraction can't read pictures of text; you'd need OCR first (not offered here), then try again.</span>
            </div>
          ) : (
            <DoneNote msg={`Extracted ${result.chars.toLocaleString()} characters from ${result.pages} page${result.pages === 1 ? "" : "s"} — .txt downloaded`} />
          )}
          {result.text && (
            <div className="relative">
              <TA value={result.text.slice(0, 50000)} readOnly className="min-h-56 max-h-80 bg-ink/60" />
            </div>
          )}
          <div className="flex gap-2">
            {result.text && <Btn v="soft" onClick={() => { navigator.clipboard?.writeText(result.text); toast("Copied to clipboard", "ok"); }}>Copy all text</Btn>}
            {result.text && <Btn v="soft" onClick={() => downloadBlob(new Blob([result.text], { type: "text/plain" }), baseName(file.name) + ".txt")}><Download size={14} /> Download .txt</Btn>}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ 19 · PDF Page Extractor ═══ */
function PageExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState(0);
  const [range, setRange] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const bufRef = useRef<ArrayBuffer | null>(null);

  const onFile = async (fs: File[]) => {
    setErr(null); setDone(null);
    try {
      const buf = await fs[0].arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0), { ignoreEncryption: false });
      setFile(fs[0]); setPages(doc.getPageCount()); bufRef.current = buf; setRange(`1-${Math.min(3, doc.getPageCount())}`);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg.includes("encrypt") || msg.includes("password") ? "This PDF is password-protected." : "Couldn't read that PDF.");
    }
  };

  const run = async () => {
    if (!bufRef.current || !file) return;
    setBusy(true); setErr(null);
    try {
      const indices = parsePageRanges(range, pages); // preserves order & duplicates
      const src = await PDFDocument.load(bufRef.current.slice(0));
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      setDone(copied.length);
      downloadBytes(bytes, `${baseName(file.name)}-pages.pdf`, "application/pdf");
      toast(`Extracted ${copied.length} page${copied.length === 1 ? "" : "s"}`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file) {
    return (
      <div className="space-y-4">
        <div className="text-[12.5px] text-fog bg-panel2 border border-line rounded-xl px-4 py-3">
          Grab exact pages — not just a contiguous range. <span className="text-cream font-mono2">2, 5, 9-12</span> pulls those pages in that order. For splitting a PDF into equal chunks, that's the sibling tool.
        </div>
        <DropZone accept=".pdf,application/pdf" onFiles={onFile} title="Drop your PDF here" />
        <Err msg={null} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{pages} pages · {fmtBytes(file.size)}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setDone(null); setErr(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      <div>
        <L hint="e.g. 2, 5, 9-12 — order is preserved">Pages to extract</L>
        <input value={range} onChange={(e) => setRange(e.target.value)} className="w-full bg-panel2 border border-line rounded-xl px-4 py-3 font-mono2 text-[14px] text-cream outline-none focus:border-acid/60" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["1", "1-3", `${pages}`, `${Math.ceil(pages / 2)}-${pages}`].map((r) => <Btn key={r} v="soft" className="!text-[11.5px] !py-1 font-mono2" onClick={() => setRange(r)}>{r}</Btn>)}
        </div>
      </div>
      {busy ? <Progress pct={0.7} label="Extracting pages" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Scissors size={15} /> Extract pages</Btn>}
      <Err msg={err} />
      {done !== null && !busy && <DoneNote msg={`New PDF with ${done} page${done === 1 ? "" : "s"} downloaded`} />}
    </div>
  );
}

/* ═══ 20 · PDF Metadata Editor ═══ */
function MetadataEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState({ title: "", author: "", subject: "", keywords: "", creator: "", producer: "" });
  const [dates, setDates] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const bufRef = useRef<ArrayBuffer | null>(null);

  const onFile = async (fs: File[]) => {
    setErr(null); setSaved(false);
    try {
      const buf = await fs[0].arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0));
      bufRef.current = buf;
      setFile(fs[0]);
      setF({
        title: doc.getTitle() || "", author: doc.getAuthor() || "", subject: doc.getSubject() || "",
        keywords: (doc.getKeywords() || ""), creator: doc.getCreator() || "", producer: doc.getProducer() || "",
      });
      setDates([doc.getCreationDate()?.toLocaleString(), doc.getModificationDate()?.toLocaleString()].filter(Boolean).join(" · modified "));
    } catch { setErr("Couldn't read that PDF (encrypted files aren't supported here)."); }
  };

  const run = async () => {
    if (!bufRef.current || !file) return;
    setBusy(true); setErr(null);
    try {
      const doc = await PDFDocument.load(bufRef.current.slice(0));
      doc.setTitle(f.title); doc.setAuthor(f.author); doc.setSubject(f.subject);
      doc.setKeywords(f.keywords.split(",").map((k) => k.trim()).filter(Boolean));
      if (f.creator) doc.setCreator(f.creator);
      doc.setModificationDate(new Date());
      const bytes = await doc.save();
      setSaved(true);
      downloadBytes(bytes, baseName(file.name) + ".pdf", "application/pdf");
      toast("Metadata updated", "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const Field = ({ k, label }: { k: keyof typeof f; label: string }) => (
    <div><L>{label}</L><input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="w-full bg-panel2 border border-line rounded-xl px-4 py-2.5 text-[13.5px] text-cream outline-none focus:border-acid/60" /></div>
  );

  if (!file) return <DropZone accept=".pdf,application/pdf" onFiles={onFile} title="Drop your PDF here" sub="read & rewrite its embedded metadata" />;
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.size)}{dates ? " · created " + dates : ""}</div></div>
        <Btn v="soft" onClick={() => { setFile(null); setSaved(false); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field k="title" label="Title" /><Field k="author" label="Author" />
        <Field k="subject" label="Subject" /><Field k="keywords" label="Keywords (comma separated)" />
        <Field k="creator" label="Creator app" /><Field k="producer" label="Producer (usually fixed)" />
      </div>
      <p className="text-[11.5px] font-mono2 text-fog/70">modification date is set to now automatically when you save</p>
      {busy ? <Progress pct={0.7} label="Rewriting metadata" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Save PDF with new metadata</Btn>}
      <Err msg={err} />
      {saved && !busy && <DoneNote msg="Updated PDF downloaded" />}
    </div>
  );
}

/* ═══ 21 · PDF Flatten ═══ */
function FlattenPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const bufRef = useRef<ArrayBuffer | null>(null);

  const onFile = async (fs: File[]) => {
    setErr(null); setAck(false);
    try {
      const buf = await fs[0].arrayBuffer();
      const doc = await PDFDocument.load(buf.slice(0));
      const n = doc.getForm().getFields().length;
      bufRef.current = buf; setFile(fs[0]); setFields(n);
    } catch { setErr("Couldn't read that PDF."); }
  };

  const run = async () => {
    if (!bufRef.current || !file) return;
    setBusy(true); setErr(null);
    try {
      const doc = await PDFDocument.load(bufRef.current.slice(0));
      doc.getForm().flatten({ updateFieldAppearances: true });
      const bytes = await doc.save();
      downloadBytes(bytes, `${baseName(file.name)}-flattened.pdf`, "application/pdf");
      toast(`Flattened ${fields} field${fields === 1 ? "" : "s"} into the page`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file) return <DropZone accept=".pdf,application/pdf" onFiles={onFile} title="Drop a fillable PDF form here" sub="entered values get baked into the page" />;
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div>
          <div className="text-[11.5px] font-mono2 text-fog">{fields > 0 ? <span className="text-acid">{fields} fillable field{fields === 1 ? "" : "s"} detected</span> : "no fillable fields found"}</div>
        </div>
        <Btn v="soft" onClick={() => setFile(null)} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      {fields > 0 ? (
        <>
          <label className="flex items-start gap-3 text-[12.5px] text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-xl px-4 py-3.5 cursor-pointer">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="accent-[#cdff3d] w-4 h-4 mt-0.5 shrink-0" />
            <span><strong>This is irreversible.</strong> After flattening, the form fields stop being editable — the values are baked in. I understand, flatten it.</span>
          </label>
          {busy ? <Progress pct={0.7} label="Flattening form" /> : <Btn v="acid" disabled={!ack} onClick={run} className="w-full !py-3.5"><Stamp size={15} /> Flatten PDF</Btn>}
        </>
      ) : (
        <div className="text-[12.5px] text-fog bg-panel2 border border-line rounded-xl px-4 py-3">This PDF has no interactive form fields to flatten — try a fillable form (W-9, application forms, etc).</div>
      )}
      <Err msg={err} />
    </div>
  );
}

/* ═══ 22 · PDF Grayscale ═══ */
function GrayscalePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PdfDocShim | null>(null);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<{ inSize: number; outSize: number } | null>(null);

  const onFile = async (fs: File[]) => {
    setErr(null); setReport(null); setPdf(null);
    try { const d = await loadPdf(await fs[0].arrayBuffer()); setFile(fs[0]); setPdf(d); }
    catch (e) { setErr((e as Error).message); }
  };

  const run = async () => {
    if (!pdf || !file) return;
    setBusy(true); setErr(null); setPct(0);
    try {
      const out = await PDFDocument.create();
      const canvas = document.createElement("canvas");
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp1 = page.getViewport({ scale: 1 });
        await renderPage(page, canvas, 1.5);
        const ctx = canvas.getContext("2d")!;
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = img.data;
        for (let p = 0; p < d.length; p += 4) {
          const g = 0.2126 * d[p] + 0.7152 * d[p + 1] + 0.0722 * d[p + 2];
          d[p] = d[p + 1] = d[p + 2] = g;
        }
        ctx.putImageData(img, 0, 0);
        const png = await dataUrlBytes(canvas.toDataURL("image/png"));
        const emb = await out.embedPng(png);
        const pg = out.addPage([vp1.width, vp1.height]);
        pg.drawImage(emb, { x: 0, y: 0, width: vp1.width, height: vp1.height });
        setPct(i / pdf.numPages);
      }
      const bytes = await out.save();
      setReport({ inSize: file.size, outSize: bytes.length });
      downloadBytes(bytes, `${baseName(file.name)}-grayscale.pdf`, "application/pdf");
      toast("Grayscale PDF saved", "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone accept=".pdf,application/pdf" onFiles={onFile} title="Drop a color PDF here" sub="print-friendly, ink-saving grayscale copy" />
      ) : (
        <>
          <Panel className="flex items-center justify-between gap-3 !py-4">
            <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{pdf?.numPages} pages · {fmtBytes(file.size)}</div></div>
            <Btn v="soft" onClick={() => { pdf?.destroy(); setFile(null); setReport(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
          </Panel>
          {busy ? <Progress pct={pct} label="Desaturating pages" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Droplet size={15} /> Convert to grayscale</Btn>}
        </>
      )}
      <Err msg={err} />
      {report && !busy && (
        <>
          <DoneNote msg="Grayscale PDF downloaded · pages were re-rendered as images, so they're no longer selectable text" />
          <Panel><Row k="Original size" v={fmtBytes(report.inSize)} /><Row k="Grayscale size" v={fmtBytes(report.outSize)} /></Panel>
        </>
      )}
    </div>
  );
}
async function dataUrlBytes(u: string) { return new Uint8Array(await (await fetch(u)).arrayBuffer()); }

/* ═══ 23 · PDF Crop Margins ═══ */
function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PdfDocShim | null>(null);
  const [mm, setMm] = useState(12);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const bufRef = useRef<ArrayBuffer | null>(null);
  const [dims, setDims] = useState<[number, number]>([595, 842]);

  const onFile = async (fs: File[]) => {
    setErr(null); setPreviewUrl(""); setPdf(null);
    try {
      const buf = await fs[0].arrayBuffer();
      const d = await loadPdf(buf.slice(0));
      bufRef.current = buf; setFile(fs[0]); setPdf(d);
      const page = await d.getPage(1);
      const vp = page.getViewport({ scale: 1 });
      setDims([vp.width, vp.height]);
      const canvas = document.createElement("canvas");
      await renderPage(page, canvas, 1.2);
      setPreviewUrl(canvas.toDataURL("image/jpeg", 0.8));
    } catch (e) { setErr((e as Error).message); }
  };

  const run = async () => {
    if (!bufRef.current || !file) return;
    setBusy(true); setErr(null);
    try {
      const inset = mm * 2.835;
      const doc = await PDFDocument.load(bufRef.current.slice(0));
      for (const page of doc.getPages()) {
        const mb = page.getMediaBox();
        const w = mb.width - inset * 2, h = mb.height - inset * 2;
        if (w > 20 && h > 20) page.setCropBox(mb.x + inset, mb.y + inset, w, h);
      }
      const bytes = await doc.save();
      downloadBytes(bytes, `${baseName(file.name)}-cropped.pdf`, "application/pdf");
      toast(`Cropped ${mm}mm from every edge`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const insetPct = mm * 2.835 / Math.min(dims[0], dims[1]) * 100;

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone accept=".pdf,application/pdf" onFiles={onFile} title="Drop your PDF here" sub="trim whitespace from every page edge" />
      ) : (
        <>
          <Panel className="flex items-center justify-between gap-3 !py-4">
            <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{pdf?.numPages} pages · {Math.round(dims[0])}×{Math.round(dims[1])}pt</div></div>
            <Btn v="soft" onClick={() => { pdf?.destroy(); setFile(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
          </Panel>
          <div>
            <L hint={`${mm} mm per side`}>Crop margin</L>
            <input type="range" className="slider" min={0} max={40} value={mm} onChange={(e) => setMm(+e.target.value)} />
            <div className="flex gap-2 mt-2.5">{[5, 10, 12, 20, 25].map((v) => <Btn key={v} v={mm === v ? "acid" : "soft"} className="!py-1.5 !text-[12px]" onClick={() => setMm(v)}>{v}mm</Btn>)}</div>
          </div>
          {previewUrl && (
            <div className="relative mx-auto w-fit border border-line rounded-xl overflow-hidden">
              <img src={previewUrl} alt="page preview" className="max-h-64 block" />
              <div className="absolute bg-acid/15 border-2 border-dashed border-acid pointer-events-none" style={{ inset: `${insetPct}%` }} />
            </div>
          )}
          {busy ? <Progress pct={0.7} label="Applying crop box" /> : <Btn v="acid" onClick={run} disabled={mm === 0} className="w-full !py-3.5"><Crop size={15} /> Crop all pages</Btn>}
          <p className="text-[11.5px] font-mono2 text-fog/70">note: cropping sets the page's visible area (crop box) — viewers & printers honor it, but the underlying content still exists outside the crop.</p>
        </>
      )}
      <Err msg={err} />
    </div>
  );
}

export const filePdfTools: ToolDef[] = [
  { id: "text-to-pdf", name: "Text to PDF", desc: "Turn plain text into a tidy paginated PDF with font, margin and page-size controls.", category: "file", icon: PenLine, keywords: ["txt to pdf", "write pdf", "notepad to pdf", "text file pdf"], processing: "client", related: ["csv-to-pdf", "rtf-to-pdf", "jpeg-to-pdf"], Component: TextToPdf },
  { id: "pdf-to-text", name: "PDF to Text", desc: "Pull all readable text out of a PDF into a copyable, downloadable .txt.", category: "file", icon: FileText, keywords: ["extract text pdf", "pdf to txt", "copy text from pdf"], processing: "client", related: ["pdf-to-html", "pdf-to-epub", "pdf-to-excel"], Component: PdfToText },
  { id: "pdf-page-extractor", name: "PDF Page Extractor", desc: "Pull exact pages — 2, 5, 9-12 — into a new PDF, in the order you specify.", category: "file", icon: Scissors, keywords: ["extract pdf pages", "split pdf pages", "save page from pdf", "pdf split"], processing: "client", featured: true, related: ["pdf-crop", "pdf-metadata-editor", "pdf-to-pptx"], Component: PageExtractor },
  { id: "pdf-metadata-editor", name: "PDF Metadata Editor", desc: "View and rewrite a PDF's title, author, subject and keywords.", category: "file", icon: Info, keywords: ["edit pdf properties", "pdf author title", "pdf info editor"], processing: "client", related: ["pdf-flatten", "pdf-page-extractor", "pdf-grayscale"], Component: MetadataEditor },
  { id: "pdf-flatten", name: "PDF Flatten (Forms)", desc: "Bake fillable form values into the page so it can't be edited anymore.", category: "file", icon: Stamp, keywords: ["flatten pdf form", "lock pdf fields", "unfillable pdf"], processing: "client", related: ["pdf-grayscale", "pdf-metadata-editor", "pdf-crop"], Component: FlattenPdf },
  { id: "pdf-grayscale", name: "PDF to Grayscale", desc: "Ink-saving black & white copy of any color PDF for printing.", category: "file", icon: Droplet, keywords: ["pdf black and white", "print friendly pdf", "desaturate pdf"], processing: "client", related: ["pdf-flatten", "pdf-to-jpeg", "pdf-crop"], Component: GrayscalePdf },
  { id: "pdf-crop", name: "PDF Crop Margins", desc: "Trim whitespace from every page edge with a live crop preview.", category: "file", icon: Crop, keywords: ["crop pdf", "trim pdf margins", "cut pdf white space"], processing: "client", related: ["pdf-page-extractor", "pdf-grayscale", "pdf-to-jpeg"], Component: CropPdf },
];
