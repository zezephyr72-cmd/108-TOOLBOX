/* ── File Converters · images & PDF-image bridges (8 entries) ──── */
import { useState } from "react";
import JSZip from "jszip";
import heic2any from "heic2any";
import UTIF from "utif";
import { PDFDocument } from "pdf-lib";
import { Image, FileImage, ImagePlus, Images, Smartphone, Repeat, RefreshCcw, FileType, Download, RotateCcw } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, Err, L, Panel, Seg } from "../lib/ui";
import {
  loadPdf, renderPage, parsePageRanges, downloadBlob, downloadBytes, fmtBytes,
  canvasToBlob, imageToCanvas, dataUrlToBytes, baseName, type PdfDocShim,
} from "../lib/files";
import { DropZone, DoneNote, FileList, Progress, toEntry, toast, type FileEntry } from "../lib/fileui";

async function zipResults(items: { name: string; blob: Blob }[], zipName: string) {
  const zip = new JSZip();
  for (const it of items) zip.file(it.name, it.blob);
  downloadBlob(await zip.generateAsync({ type: "blob" }), zipName);
}

/* ═══ 1–2 · PDF → JPEG / PNG ═══ */
function PdfToImages({ fmt }: { fmt: "jpeg" | "png" }) {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<PdfDocShim | null>(null);
  const [pages, setPages] = useState(0);
  const [mode, setMode] = useState<"all" | "range">("all");
  const [rangeText, setRangeText] = useState("");
  const [scale, setScale] = useState("2");
  const [quality, setQuality] = useState(85);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; blob: Blob }[] | null>(null);
  const ext = fmt === "jpeg" ? "jpg" : "png";
  const mime = fmt === "jpeg" ? "image/jpeg" : "image/png";

  const onFile = async (fs: File[]) => {
    setErr(null); setDone(null); setPdf(null);
    try {
      const d = await loadPdf(await fs[0].arrayBuffer());
      setFile(fs[0]); setPdf(d); setPages(d.numPages);
    } catch (e) { setErr((e as Error).message); }
  };
  const reset = () => { pdf?.destroy(); setFile(null); setPdf(null); setDone(null); setErr(null); setRangeText(""); };

  const run = async () => {
    if (!pdf || !file) return;
    setBusy(true); setErr(null); setPct(0);
    try {
      const indices = mode === "all" ? Array.from({ length: pages }, (_, i) => i) : parsePageRanges(rangeText, pages);
      const canvas = document.createElement("canvas");
      const out: { name: string; blob: Blob }[] = [];
      for (let k = 0; k < indices.length; k++) {
        const page = await pdf.getPage(indices[k] + 1);
        await renderPage(page, canvas, +scale);
        const blob = await canvasToBlob(canvas, mime, fmt === "jpeg" ? quality / 100 : undefined);
        out.push({ name: `${baseName(file.name)}-page-${indices[k] + 1}.${ext}`, blob });
        setPct((k + 1) / indices.length);
      }
      setDone(out);
      if (out.length === 1) downloadBlob(out[0].blob, out[0].name);
      else await zipResults(out, `${baseName(file.name)}-pages.zip`);
      toast(`Exported ${out.length} page${out.length === 1 ? "" : "s"} as ${fmt.toUpperCase()}`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  if (!file) return <DropZone accept=".pdf,application/pdf" onFiles={onFile} title="Drop your PDF here" sub="or click to browse · processed entirely on your device" />;
  return (
    <div className="space-y-4">
      <Panel className="flex items-center justify-between gap-3 !py-4">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-cream truncate">{file.name}</div>
          <div className="text-[11.5px] font-mono2 text-fog">{pages} page{pages === 1 ? "" : "s"} · {fmtBytes(file.size)}</div>
        </div>
        <Btn v="soft" onClick={reset} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
      </Panel>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <L>Pages</L>
          <Seg options={[{ v: "all", label: `All ${pages}` }, { v: "range", label: "Custom range" }]} value={mode} onChange={setMode} />
          {mode === "range" && (
            <input value={rangeText} onChange={(e) => setRangeText(e.target.value)} placeholder="e.g. 1, 3, 5-8"
              className="mt-3 w-full bg-panel2 border border-line rounded-xl px-4 py-2.5 font-mono2 text-[13px] text-cream outline-none focus:border-acid/60" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <L>Resolution</L>
            <Seg options={["1", "1.5", "2", "3"].map((s) => ({ v: s, label: `${s}×` }))} value={scale} onChange={setScale} />
          </div>
          {fmt === "jpeg" && (
            <div>
              <L hint={`${quality}%`}>Quality</L>
              <input type="range" className="slider mt-4" min={40} max={98} value={quality} onChange={(e) => setQuality(+e.target.value)} />
            </div>
          )}
        </div>
      </div>
      {busy ? <Progress pct={pct} label={`Rendering page images`} /> : (
        <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Convert to {fmt.toUpperCase()}</Btn>
      )}
      <Err msg={err} />
      {done && !busy && (
        <>
          <DoneNote msg={done.length === 1 ? `Saved ${done[0].name} (${fmtBytes(done[0].blob.size)})` : `${done.length} images zipped & downloaded`} />
          {done.length > 1 && (
            <Panel className="max-h-44 overflow-y-auto">
              {done.map((d, i) => (
                <div key={i} className="flex justify-between py-1.5 font-mono2 text-[12px] border-b border-line last:border-0">
                  <span className="text-cream truncate">{d.name}</span><span className="text-fog shrink-0">{fmtBytes(d.blob.size)}</span>
                </div>
              ))}
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

/* ═══ 3–4 · JPEG / PNG → PDF ═══ */
function ImagesToPdf({ label, accept }: { label: string; accept: string }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [mode, setMode] = useState<"fit" | "actual">("fit");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [doneSize, setDoneSize] = useState<number | null>(null);

  const addFiles = (fs: File[]) => {
    setErr(null); setDoneSize(null);
    setFiles((x) => [...x, ...fs.map((f) => {
      const e = toEntry(f);
      if (f.type.startsWith("image/")) e.thumb = URL.createObjectURL(f);
      return e;
    })]);
  };
  const remove = (id: string) => setFiles((x) => x.filter((f) => f.id !== id));

  const run = async () => {
    if (!files.length) return;
    setBusy(true); setErr(null); setPct(0);
    try {
      const doc = await PDFDocument.create();
      const [PW, PH] = [595.28, 841.89];
      const M = 26;
      for (let i = 0; i < files.length; i++) {
        const f = files[i].file;
        const buf = await f.arrayBuffer();
        let img;
        if (f.type === "image/jpeg" || /\.jpe?g$/i.test(f.name)) img = await doc.embedJpg(buf);
        else if (f.type === "image/png" || /\.png$/i.test(f.name)) img = await doc.embedPng(buf);
        else { // webp & friends via canvas
          const canvas = await imageToCanvas(f);
          img = await doc.embedPng(await dataUrlToBytes(canvas.toDataURL("image/png")));
        }
        if (mode === "fit") {
          const landscape = img.width > img.height;
          const [w, h] = landscape ? [PH, PW] : [PW, PH];
          const page = doc.addPage([w, h]);
          const s = Math.min((w - M * 2) / img.width, (h - M * 2) / img.height);
          const dw = img.width * s, dh = img.height * s;
          page.drawImage(img, { x: (w - dw) / 2, y: (h - dh) / 2, width: dw, height: dh });
        } else {
          const w = img.width * 0.75, h = img.height * 0.75;
          const page = doc.addPage([w, h]);
          page.drawImage(img, { x: 0, y: 0, width: w, height: h });
        }
        setPct((i + 1) / files.length);
      }
      const bytes = await doc.save();
      setDoneSize(bytes.length);
      downloadBytes(bytes, "images.pdf", "application/pdf");
      toast(`PDF saved — ${files.length} page${files.length === 1 ? "" : "s"}`, "ok");
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <DropZone accept={accept} multiple onFiles={addFiles} compact={files.length > 0} title={files.length ? "Add more images" : `Drop ${label} images here`} sub={files.length ? undefined : "multiple files · drag rows to reorder pages"} />
      {files.length > 0 && (
        <>
          <FileList files={files} thumbs onRemove={remove} onReorder={(a, b) => setFiles((x) => { const y = [...x]; const [m] = y.splice(a, 1); y.splice(b, 0, m); return y; })} />
          <div>
            <L>Page layout</L>
            <Seg options={[{ v: "fit", label: "Fit to A4 with margins" }, { v: "actual", label: "Actual image size" }]} value={mode} onChange={setMode} />
          </div>
          {busy ? <Progress pct={pct} label="Embedding images" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Create PDF — {files.length} page{files.length === 1 ? "" : "s"}</Btn>}
        </>
      )}
      <Err msg={err} />
      {doneSize !== null && !busy && <DoneNote msg={`images.pdf downloaded (${fmtBytes(doneSize)})`} />}
    </div>
  );
}

/* ═══ 5 · HEIC → JPEG ═══ */
function HeicToJpeg() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [quality, setQuality] = useState(85);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; blob: Blob; from: number }[] | null>(null);

  const run = async () => {
    if (!files.length) return;
    setBusy(true); setErr(null); setPct(0);
    try {
      const out: { name: string; blob: Blob; from: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i].file;
        const res = await heic2any({ blob: f, toType: "image/jpeg", quality: quality / 100 });
        const blob = Array.isArray(res) ? res[0] : res;
        out.push({ name: baseName(f.name) + ".jpg", blob, from: f.size });
        setPct((i + 1) / files.length);
      }
      setDone(out);
      if (out.length === 1) downloadBlob(out[0].blob, out[0].name);
      else await zipResults(out, "heic-converted.zip");
      toast("HEIC conversion complete", "ok");
    } catch { setErr("Couldn't decode that HEIC file — it may be an unsupported variant (try a different photo)."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-[12.5px] text-fog bg-panel2 border border-line rounded-xl px-4 py-3">
        HEIC decoding happens fully on your device and is heavier than most conversions — expect a few seconds per photo. That's normal.
      </div>
      <DropZone accept=".heic,.heif,image/heic,image/heif" multiple onFiles={(fs) => { setFiles((x) => [...x, ...fs.map(toEntry)]); setDone(null); setErr(null); }} compact={files.length > 0} title={files.length ? "Add more photos" : "Drop HEIC photos here"} sub="iPhone & iPad camera format" />
      {files.length > 0 && (
        <>
          <FileList files={files} onRemove={(id) => setFiles((x) => x.filter((f) => f.id !== id))} />
          <div><L hint={`${quality}%`}>JPEG quality</L><input type="range" className="slider" min={40} max={98} value={quality} onChange={(e) => setQuality(+e.target.value)} /></div>
          {busy ? <Progress pct={pct} label="Decoding HEIC (this takes a moment)" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Convert {files.length} to JPEG</Btn>}
        </>
      )}
      <Err msg={err} />
      {done && !busy && (
        <>
          <DoneNote msg={done.length === 1 ? "Converted & downloaded" : `${done.length} JPEGs zipped & downloaded`} />
          <Panel>{done.map((d, i) => (
            <div key={i} className="flex justify-between py-1.5 font-mono2 text-[12px] border-b border-line last:border-0">
              <span className="text-cream truncate">{d.name}</span>
              <span className="text-fog shrink-0">{fmtBytes(d.from)} → <span className="text-acid">{fmtBytes(d.blob.size)}</span></span>
            </div>
          ))}</Panel>
        </>
      )}
    </div>
  );
}

/* ═══ 6 · WEBP ↔ JPEG ═══ */
function ImgConvert({ from, to }: { from: string; to: "image/jpeg" | "image/webp" }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; blob: Blob; from: number; url: string }[] | null>(null);
  const toExt = to === "image/jpeg" ? "jpg" : "webp";
  const accepts: Record<string, string> = {
    webp: ".webp,image/webp",
    jpeg: ".jpg,.jpeg,.png,image/jpeg,image/png",
  };

  const run = async () => {
    if (!files.length) return;
    setBusy(true); setErr(null);
    try {
      const out: { name: string; blob: Blob; from: number; url: string }[] = [];
      for (const f of files) {
        const canvas = await imageToCanvas(f.file);
        if (to === "image/jpeg") { // flatten alpha onto white
          const flat = document.createElement("canvas");
          flat.width = canvas.width; flat.height = canvas.height;
          const ctx = flat.getContext("2d")!;
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, flat.width, flat.height);
          ctx.drawImage(canvas, 0, 0);
          const blob = await canvasToBlob(flat, to, 0.92);
          out.push({ name: baseName(f.file.name) + "." + toExt, blob, from: f.file.size, url: URL.createObjectURL(blob) });
        } else {
          const blob = await canvasToBlob(canvas, to, 0.9);
          out.push({ name: baseName(f.file.name) + "." + toExt, blob, from: f.file.size, url: URL.createObjectURL(blob) });
        }
      }
      setDone(out);
      if (out.length === 1) downloadBlob(out[0].blob, out[0].name);
      else await zipResults(out, `converted-${toExt}.zip`);
      toast(`Converted ${out.length} image${out.length === 1 ? "" : "s"}`, "ok");
    } catch { setErr("Couldn't decode one of those images in this browser."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <DropZone accept={accepts[from]} multiple onFiles={(fs) => { setFiles((x) => [...x, ...fs.map(toEntry)]); setDone(null); }} compact={files.length > 0} title={files.length ? "Add more" : `Drop ${from.toUpperCase()} images here`} />
      {files.length > 0 && (
        <>
          <FileList files={files} onRemove={(id) => setFiles((x) => x.filter((f) => f.id !== id))} />
          {busy ? <Progress pct={0.5} label="Converting" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Convert to {toExt.toUpperCase()}</Btn>}
        </>
      )}
      <Err msg={err} />
      {done && (
        <>
          <DoneNote msg={done.length === 1 ? "Converted & downloaded" : `${done.length} files zipped & downloaded`} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {done.map((d, i) => (
              <div key={i} className="border border-line rounded-xl overflow-hidden bg-panel">
                <img src={d.url} alt="" className="w-full h-24 object-contain bg-panel2" />
                <div className="px-2.5 py-2 font-mono2 text-[10.5px] text-fog truncate">{fmtBytes(d.from)} → <span className={d.blob.size < d.from ? "text-acid" : "text-cream"}>{fmtBytes(d.blob.size)}</span></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══ 11 · TIFF → JPEG/PNG ═══ */
function TiffConvert() {
  const [file, setFile] = useState<FileEntry | null>(null);
  const [target, setTarget] = useState<"png" | "jpeg">("png");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; blob: Blob }[] | null>(null);

  const run = async () => {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const buf = await file.file.arrayBuffer();
      const ifds = UTIF.decode(buf);
      const out: { name: string; blob: Blob }[] = [];
      for (let i = 0; i < ifds.length; i++) {
        UTIF.decodeImage(buf, ifds[i]);
        const rgba = UTIF.toRGBA8(ifds[i]);
        const canvas = document.createElement("canvas");
        canvas.width = ifds[i].width; canvas.height = ifds[i].height;
        const ctx = canvas.getContext("2d")!;
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        imgData.data.set(rgba);
        ctx.putImageData(imgData, 0, 0);
        const blob = await canvasToBlob(canvas, target === "png" ? "image/png" : "image/jpeg", 0.92);
        out.push({ name: `${baseName(file.file.name)}${ifds.length > 1 ? `-frame-${i + 1}` : ""}.${target === "png" ? "png" : "jpg"}`, blob });
      }
      setDone(out);
      if (out.length === 1) downloadBlob(out[0].blob, out[0].name);
      else await zipResults(out, `${baseName(file.file.name)}-frames.zip`);
      toast(`Converted ${out.length} frame${out.length === 1 ? "" : "s"}`, "ok");
    } catch { setErr("Couldn't decode that TIFF — some compression variants aren't supported."); }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone accept=".tif,.tiff,image/tiff" onFiles={(fs) => { setFile(toEntry(fs[0])); setDone(null); setErr(null); }} title="Drop a TIFF image here" sub="multi-page TIFFs export one file per frame" />
      ) : (
        <>
          <Panel className="flex items-center justify-between gap-3 !py-4">
            <div className="min-w-0"><div className="text-[14px] font-semibold text-cream truncate">{file.file.name}</div><div className="text-[11.5px] font-mono2 text-fog">{fmtBytes(file.file.size)}</div></div>
            <Btn v="soft" onClick={() => { setFile(null); setDone(null); }} className="shrink-0"><RotateCcw size={13} /> New file</Btn>
          </Panel>
          <div><L>Output format</L><Seg options={[{ v: "png" as const, label: "PNG (lossless)" }, { v: "jpeg" as const, label: "JPEG (smaller)" }]} value={target} onChange={setTarget} /></div>
          {busy ? <Progress pct={0.6} label="Decoding TIFF" /> : <Btn v="acid" onClick={run} className="w-full !py-3.5"><Download size={15} /> Convert to {target.toUpperCase()}</Btn>}
        </>
      )}
      <Err msg={err} />
      {done && !busy && <DoneNote msg={done.length === 1 ? "Converted & downloaded" : `${done.length} frames zipped & downloaded`} />}
    </div>
  );
}

export const fileImageTools: ToolDef[] = [
  { id: "pdf-to-jpeg", name: "PDF to JPEG", desc: "Render any pages of a PDF into high-quality JPEGs — zipped when multi-page.", category: "file", icon: Image, keywords: ["pdf to jpg", "export pdf pages", "pdf as images", "convert pdf photo"], processing: "client", related: ["pdf-to-png", "jpeg-to-pdf", "pdf-to-text"], Component: () => <PdfToImages fmt="jpeg" /> },
  { id: "pdf-to-png", name: "PDF to PNG", desc: "Lossless PNG images from PDF pages, at up to 3× resolution.", category: "file", icon: FileImage, keywords: ["pdf to png", "pdf pages as png", "lossless pdf image"], processing: "client", related: ["pdf-to-jpeg", "png-to-pdf", "webp-to-jpeg"], Component: () => <PdfToImages fmt="png" /> },
  { id: "jpeg-to-pdf", name: "JPEG to PDF", desc: "Combine JPG photos into one PDF — drag to reorder, fit or actual size.", category: "file", icon: ImagePlus, keywords: ["jpg to pdf", "photos to pdf", "combine images pdf", "merge jpg"], processing: "client", related: ["png-to-pdf", "pdf-to-jpeg", "heic-to-jpeg", "text-to-pdf"], Component: () => <ImagesToPdf label="JPEG" accept=".jpg,.jpeg,image/jpeg" /> },
  { id: "png-to-pdf", name: "PNG to PDF", desc: "Turn PNG (or WebP) images into a polished PDF document in seconds.", category: "file", icon: Images, keywords: ["png to pdf", "images into pdf", "screenshots to pdf"], processing: "client", related: ["jpeg-to-pdf", "pdf-to-png", "webp-to-jpeg"], Component: () => <ImagesToPdf label="PNG / WebP" accept=".png,.webp,.jpg,.jpeg,image/png,image/webp,image/jpeg" /> },
  { id: "heic-to-jpeg", name: "HEIC to JPEG", desc: "Convert iPhone HEIC photos to universal JPEGs, right on your device.", category: "file", icon: Smartphone, keywords: ["heic converter", "iphone photos", "heif to jpg"], processing: "client", related: ["webp-to-jpeg", "jpeg-to-pdf", "tiff-converter"], Component: HeicToJpeg },
  { id: "webp-to-jpeg", name: "WebP to JPEG", desc: "Universal-ize WebP images as JPEGs with size stats per file.", category: "file", icon: Repeat, keywords: ["webp converter", "webp to jpg", "image format"], processing: "client", related: ["jpeg-to-webp", "heic-to-jpeg", "png-to-pdf"], Component: () => <ImgConvert from="webp" to="image/jpeg" /> },
  { id: "jpeg-to-webp", name: "JPEG to WebP", desc: "Shrink JPG/PNG files into modern WebP — see the savings instantly.", category: "file", icon: RefreshCcw, keywords: ["jpg to webp", "compress images webp", "optimize images"], processing: "client", related: ["webp-to-jpeg", "tiff-converter", "jpeg-to-pdf"], Component: () => <ImgConvert from="jpeg" to="image/webp" /> },
  { id: "tiff-converter", name: "TIFF to JPEG / PNG", desc: "Decode TIFFs (even multi-frame ones) into web-friendly formats.", category: "file", icon: FileType, keywords: ["tif converter", "tiff to png", "tiff to jpg", "scan convert"], processing: "client", related: ["heic-to-jpeg", "webp-to-jpeg", "pdf-to-png"], Component: TiffConvert },
];
