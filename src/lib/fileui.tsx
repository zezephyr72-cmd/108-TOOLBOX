/* Shared upload / progress / toast components for file tools */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, File as FileIcon, GripVertical, Trash2, Upload, XCircle, Info } from "lucide-react";
import { cx } from "./ui";
import { fmtBytes } from "./files";

/* ───────── toast system ───────── */
type Toast = { id: number; msg: string; kind: "ok" | "err" | "info" };
let pushToast: ((t: Toast) => void) | null = null;

export function toast(msg: string, kind: Toast["kind"] = "info") {
  pushToast?.({ id: Math.random(), msg, kind });
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    pushToast = (t) => {
      setItems((x) => [...x.slice(-3), t]);
      setTimeout(() => setItems((x) => x.filter((y) => y.id !== t.id)), 4200);
    };
    return () => { pushToast = null; };
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-[150] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex items-center gap-2.5 bg-panel border border-line2 rounded-xl px-4 py-3 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.7)] max-w-sm"
          >
            {t.kind === "ok" && <CheckCircle2 size={15} className="text-acid shrink-0" />}
            {t.kind === "err" && <XCircle size={15} className="text-red-400 shrink-0" />}
            {t.kind === "info" && <Info size={15} className="text-fog shrink-0" />}
            <span className="text-[12.5px] text-cream leading-snug">{t.msg}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ───────── dropzone ───────── */
export function DropZone({ accept, multiple = false, maxMB = 100, onFiles, title, sub, compact = false }: {
  accept: string;
  multiple?: boolean;
  maxMB?: number;
  onFiles: (files: File[]) => void;
  title: string;
  sub?: string;
  compact?: boolean;
}) {
  const [over, setOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const exts = accept.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

  const validate = (fs: File[]) => {
    const ok: File[] = [];
    let msg: string | null = null;
    for (const f of fs) {
      const name = f.name.toLowerCase();
      const extOk = exts.some((e) =>
        e.startsWith(".") ? name.endsWith(e) : e.endsWith("/*") ? f.type.startsWith(e.slice(0, -1)) : f.type === e
      );
      if (!extOk) { msg = `“${f.name}” isn't supported here — accepted: ${exts.join(" ")}`; continue; }
      if (f.size > maxMB * 1048576) { msg = `“${f.name}” is ${fmtBytes(f.size)} — over the ${maxMB} MB limit`; continue; }
      ok.push(f);
    }
    if (ok.length) { setErr(null); onFiles(ok); } else if (msg) setErr(msg);
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); validate([...e.dataTransfer.files]); }}
        className={cx(
          "border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all select-none",
          compact ? "p-6" : "p-10 sm:p-14",
          over ? "border-acid bg-acid/5 scale-[1.005]" : "border-line2 hover:border-fog/50 hover:bg-panel2/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => { validate([...(e.target.files || [])]); e.target.value = ""; }}
        />
        <span className={cx("mx-auto grid place-items-center rounded-2xl bg-panel2 border border-line text-fog transition-colors", compact ? "w-10 h-10" : "w-14 h-14", over && "text-acid border-acid/40")}>
          <Upload size={compact ? 17 : 22} />
        </span>
        <div className={cx("font-semibold tracking-tight text-cream", compact ? "mt-3 text-[14px]" : "mt-4 text-[16px]")}>{title}</div>
        {sub && <div className="mt-1.5 text-[12px] font-mono2 text-fog">{sub}</div>}
      </div>
      {err && (
        <div className="mt-3 text-[12.5px] font-mono2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">{err}</div>
      )}
    </div>
  );
}

/* ───────── progress bar ───────── */
export function Progress({ pct, label }: { pct: number; label?: string }) {
  return (
    <div className="bg-ink/60 border border-line rounded-xl p-4">
      <div className="flex justify-between items-center text-[11px] font-mono2 uppercase tracking-widest text-fog">
        <span className="flex items-center gap-2">
          <span className="relative w-1.5 h-1.5 rounded-full bg-acid ping-dot" />
          {label || "Processing"}
        </span>
        <span className="text-acid tabular-nums">{Math.round(pct * 100)}%</span>
      </div>
      <div className="mt-2.5 h-1.5 bg-panel2 rounded-full overflow-hidden">
        <div className="h-full bg-acid rounded-full transition-all duration-200" style={{ width: `${Math.min(100, pct * 100)}%` }} />
      </div>
    </div>
  );
}

/* ───────── file list (removable, drag-reorderable) ───────── */
export interface FileEntry { id: string; file: File; thumb?: string }
let fileSeq = 0;
export const toEntry = (f: File): FileEntry => ({ id: `${Date.now()}-${fileSeq++}`, file: f });

export function FileList({ files, onRemove, onReorder, thumbs = false }: {
  files: FileEntry[];
  onRemove: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
  thumbs?: boolean;
}) {
  const dragIdx = useRef<number>(-1);
  const [overIdx, setOverIdx] = useState(-1);
  return (
    <div className="border border-line rounded-xl overflow-hidden divide-y divide-line">
      {files.map((f, i) => (
        <div
          key={f.id}
          draggable={!!onReorder}
          onDragStart={() => { dragIdx.current = i; }}
          onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
          onDragEnd={() => setOverIdx(-1)}
          onDrop={(e) => { e.preventDefault(); onReorder?.(dragIdx.current, i); dragIdx.current = -1; setOverIdx(-1); }}
          className={cx("flex items-center gap-3 px-3.5 py-2.5 bg-panel transition-colors", overIdx === i && dragIdx.current !== i && "bg-acid/5")}
        >
          {onReorder && <GripVertical size={14} className="text-fog/40 shrink-0 cursor-grab active:cursor-grabbing" />}
          {thumbs && f.thumb ? (
            <img src={f.thumb} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-line" />
          ) : (
            <span className="w-9 h-9 rounded-lg bg-panel2 border border-line grid place-items-center shrink-0 text-fog"><FileIcon size={14} /></span>
          )}
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] text-cream truncate">{f.file.name}</span>
            <span className="block text-[11px] font-mono2 text-fog">{fmtBytes(f.file.size)}{onReorder && i === 0 ? " · first page" : ""}</span>
          </span>
          <span className="font-mono2 text-[10px] text-fog/50 w-5 text-right shrink-0">{i + 1}</span>
          <button onClick={() => onRemove(f.id)} className="text-fog hover:text-red-400 transition-colors cursor-pointer p-1 shrink-0"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
}

/* ───────── done + reset row ───────── */
export function DoneNote({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px] font-mono2 text-acid bg-acid/8 border border-acid/20 rounded-xl px-4 py-3">
      <CheckCircle2 size={14} className="shrink-0" /> {msg}
    </div>
  );
}
