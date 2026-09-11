import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { catOf, searchTools, TOOLS } from "../tools/registry";
import { cx } from "../lib/ui";

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchTools(q), [q]);
  const shown = results.slice(0, 14);

  useEffect(() => {
    if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);
  useEffect(() => { setSel(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
      else if (e.key === "Enter" && shown[sel]) { onClose(); nav(`/tool/${shown[sel].id}`); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, shown, sel, nav, onClose]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] bg-ink/80 backdrop-blur-md flex items-start justify-center pt-[12vh] px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl bg-panel border border-line2 rounded-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 border-b border-line">
              <Search size={17} className="text-fog shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${TOOLS.length} tools…`}
                className="flex-1 bg-transparent py-4 text-[15px] outline-none placeholder:text-fog/50 text-cream"
              />
              <kbd className="key">esc</kbd>
            </div>
            <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
              {shown.length === 0 && (
                <div className="px-4 py-10 text-center text-fog text-sm">
                  Nothing matches <span className="text-cream font-mono2">“{q}”</span> — try “json”, “timer” or “color”
                </div>
              )}
              {shown.map((t, i) => (
                <button
                  key={t.id}
                  data-idx={i}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => { onClose(); nav(`/tool/${t.id}`); }}
                  className={cx(
                    "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-left transition-colors cursor-pointer",
                    i === sel ? "bg-acid/10 border border-acid/25" : "border border-transparent"
                  )}
                >
                  <span className={cx("w-9 h-9 rounded-lg grid place-items-center shrink-0 border", i === sel ? "bg-acid text-ink border-acid" : "bg-panel2 text-fog border-line")}>
                    <t.icon size={15} strokeWidth={2.2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold text-cream truncate">{t.name}</span>
                    <span className="block text-[11.5px] text-fog truncate">{t.desc}</span>
                  </span>
                  <span className="font-mono2 text-[10px] uppercase tracking-widest text-fog/70 shrink-0 hidden sm:block">{catOf(t.category).label}</span>
                  <ArrowUpRight size={14} className={cx("shrink-0", i === sel ? "text-acid" : "text-fog/30")} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 px-5 py-3 border-t border-line text-[10.5px] font-mono2 text-fog/70">
              <span className="flex items-center gap-1.5"><kbd className="key">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1.5"><kbd className="key">↵</kbd> open</span>
              <span className="ml-auto">{results.length} result{results.length === 1 ? "" : "s"}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
