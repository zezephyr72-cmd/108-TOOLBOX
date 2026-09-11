/* Shared design primitives for every tool */
import { useState, type ReactNode, type SelectHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { Check, Copy } from "lucide-react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- clipboard hook ---------- */
export function useCopy(): [string | null, (t: string, id?: string) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (t: string, id = "x") => {
    navigator.clipboard?.writeText(t).catch(() => {});
    setCopied(id);
    window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400);
  };
  return [copied, copy];
}

/* ---------- label ---------- */
export function L({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <label className="text-[11px] font-mono2 uppercase tracking-[0.18em] text-fog">{children}</label>
      {hint && <span className="text-[11px] font-mono2 text-fog/60">{hint}</span>}
    </div>
  );
}

/* ---------- inputs ---------- */
const inputBase =
  "w-full bg-panel2 border border-line rounded-xl px-4 py-3 text-sm text-cream placeholder:text-fog/40 outline-none focus:border-acid/60 focus:ring-2 focus:ring-acid/10 transition-all";

export function In(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputBase, props.className)} />;
}

export function Num(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" inputMode="decimal" {...props} className={cx(inputBase, "font-mono2 tabular-nums", props.className)} />;
}

export function TA(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      spellCheck={false}
      {...props}
      className={cx(inputBase, "font-mono2 text-[13px] leading-relaxed resize-y min-h-36", props.className)}
    />
  );
}

export function Sel({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(inputBase, "appearance-none bg-no-repeat pr-10 cursor-pointer", props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239aa0a6' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 14px center",
      }}
    >
      {children}
    </select>
  );
}

/* ---------- buttons ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { v?: "acid" | "ghost" | "soft" };
export function Btn({ v = "ghost", ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold tracking-tight transition-all active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:pointer-events-none",
        v === "acid" && "bg-acid text-ink hover:shadow-[0_0_28px_-6px_rgba(205,255,61,0.55)] hover:brightness-105",
        v === "ghost" && "border border-line2 text-cream/80 hover:border-acid/50 hover:text-cream bg-transparent",
        v === "soft" && "bg-panel2 border border-line text-cream/70 hover:text-cream hover:border-line2",
        props.className
      )}
    >
      {props.children}
    </button>
  );
}

/* ---------- copy button ---------- */
export function CopyBtn({ text, label = "Copy", id }: { text: string; label?: string; id?: string }) {
  const [copied, copy] = useCopy();
  const k = id || label;
  return (
    <Btn v="soft" onClick={() => copy(text, k)} className="!px-3 !py-1.5 !text-[12px]">
      {copied === k ? <Check size={13} className="text-acid" /> : <Copy size={13} />}
      {copied === k ? "Copied" : label}
    </Btn>
  );
}

/* ---------- toggle ---------- */
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-2.5 cursor-pointer group select-none"
    >
      <span
        className={cx(
          "w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0",
          on ? "bg-acid" : "bg-panel2 border border-line2"
        )}
      >
        <span
          className={cx(
            "absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full transition-all duration-200",
            on ? "left-[18px] bg-ink" : "left-[3px] bg-fog group-hover:bg-cream"
          )}
        />
      </span>
      <span className={cx("text-[13px] transition-colors", on ? "text-cream" : "text-fog group-hover:text-cream/80")}>{label}</span>
    </button>
  );
}

/* ---------- segmented control ---------- */
export function Seg<T extends string>({ options, value, onChange }: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap bg-panel2 border border-line rounded-xl p-1 gap-1">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={cx(
            "px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-all cursor-pointer",
            value === o.v ? "bg-acid text-ink shadow-sm" : "text-fog hover:text-cream"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- output box ---------- */
export function Out({ value, placeholder = "Result appears here…", mono = true, rows = 5, copyId }: {
  value: string;
  placeholder?: string;
  mono?: boolean;
  rows?: number;
  copyId?: string;
}) {
  return (
    <div className="relative group">
      <pre
        className={cx(
          "w-full bg-ink/70 border border-line rounded-xl px-4 py-3.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words min-h-[3.4rem] max-h-96 overflow-auto",
          mono && "font-mono2",
          value ? "text-cream" : "text-fog/40"
        )}
        style={{ minHeight: `${rows * 1.55}rem` }}
      >
        {value || placeholder}
      </pre>
      {value && (
        <div className="absolute top-2.5 right-2.5">
          <CopyBtn text={value} id={copyId || value.slice(0, 30)} />
        </div>
      )}
    </div>
  );
}

/* ---------- stat display ---------- */
export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="bg-ink/60 border border-line rounded-xl px-4 py-3.5">
      <div className={cx("text-[26px] font-semibold tracking-tight tabular-nums font-mono2 leading-none", accent ? "text-acid" : "text-cream")}>
        {value}
      </div>
      <div className="mt-1.5 text-[10.5px] font-mono2 uppercase tracking-[0.16em] text-fog">{label}</div>
    </div>
  );
}

/* ---------- section panel ---------- */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("bg-panel border border-line rounded-2xl p-5 sm:p-6", className)}>{children}</div>;
}

/* ---------- error note ---------- */
export function Err({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="mt-3 text-[12.5px] font-mono2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3.5 py-2.5">
      {msg}
    </div>
  );
}

/* ---------- result row ---------- */
export function Row({ k, v, mono = true }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-line last:border-0">
      <span className="text-[13px] text-fog">{k}</span>
      <span className={cx("text-[13.5px] text-cream text-right break-all", mono && "font-mono2 tabular-nums")}>{v}</span>
    </div>
  );
}

/* ---------- misc helpers ---------- */
export const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });

export function download(content: string, filename: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : Math.abs(a);
}
