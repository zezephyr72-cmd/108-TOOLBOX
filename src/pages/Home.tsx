import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Search, Sparkle } from "lucide-react";
import { CATEGORIES, searchTools, TOOLS } from "../tools/registry";
import type { ToolDef } from "../lib/types";
import { cx } from "../lib/ui";

function ToolCard({ t, i }: { t: ToolDef; i: number }) {
  return (
    <Link to={`/tool/${t.id}`} className="tool-card group relative block h-[148px] bg-panel border border-line rounded-2xl overflow-hidden transition-colors duration-300 hover:border-acid/0">
      <div className="sweep absolute inset-0 bg-acid" />
      <div className="relative h-full p-5 flex flex-col">
        <div className="flex items-start justify-between">
          <span className="card-num font-mono2 text-[11px] text-fog/50">{String(i + 1).padStart(3, "0")}</span>
          <span className="flex items-center gap-2">
            {t.soon && <span className="font-mono2 text-[9px] uppercase tracking-widest text-acid border border-acid/40 rounded-full px-2 py-0.5 group-hover:opacity-0 transition-opacity">soon</span>}
            <span className="card-icon text-fog"><t.icon size={17} strokeWidth={2} /></span>
          </span>
        </div>
        <div className="mt-auto">
          <div className="card-name text-[15px] font-semibold tracking-tight text-cream">{t.name}</div>
          <div className="card-desc mt-1 text-[12px] leading-snug text-fog line-clamp-2">{t.desc}</div>
        </div>
      </div>
      <ArrowUpRight size={16} className="card-arrow absolute bottom-4 right-4 text-ink" />
    </Link>
  );
}

const rise = {
  hidden: { opacity: 0, y: 26 },
  show: (d: number) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Home({ openPalette }: { openPalette: () => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const nav = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);
  const [params] = useSearchParams();
  useEffect(() => {
    const c = params.get("c");
    if (c && CATEGORIES.some((x) => x.id === c)) {
      setCat(c);
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [params]);

  const popular = TOOLS.filter((t) => t.featured).slice(0, 6);
  const filtered = useMemo(() => {
    let pool = cat === "all" ? TOOLS : cat === "popular" ? TOOLS.filter((t) => t.featured) : TOOLS.filter((t) => t.category === cat);
    return searchTools(q, pool);
  }, [q, cat]);
  const filtering = q.trim().length > 0 || cat !== "all";

  const marqueeItems = TOOLS.map((t) => t.name);
  const marquee = [...marqueeItems, ...marqueeItems];

  return (
    <div>
      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative pt-28 sm:pt-36 pb-14 px-5 overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.13]" style={{ background: "radial-gradient(closest-side, #cdff3d, transparent)" }} />
          <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 90% 70% at 50% 30%, black, transparent)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div variants={rise} initial="hidden" animate="show" custom={0}>
            <div className="inline-flex items-center gap-2.5 border border-line rounded-full px-4 py-1.5 text-[11px] font-mono2 uppercase tracking-[0.2em] text-fog">
              <span className="relative w-1.5 h-1.5 rounded-full bg-acid ping-dot" />
              {TOOLS.length} tools · free forever · no sign-up
            </div>
          </motion.div>

          <motion.h1 variants={rise} initial="hidden" animate="show" custom={0.08}
            className="mt-7 text-[13.5vw] sm:text-[11vw] lg:text-[104px] leading-[0.95] font-bold tracking-[-0.035em]">
            Every tool
            <br />
            you'll ever <span className="font-serifit italic font-normal text-acid tracking-[-0.01em]">need.</span>
          </motion.h1>

          <motion.p variants={rise} initial="hidden" animate="show" custom={0.16} className="mt-6 max-w-md text-[15px] leading-relaxed text-fog">
            {TOOLS.length} fast, private utilities that run entirely in your browser. No accounts, no uploads, no ads — just tools that work.
          </motion.p>

          {/* search */}
          <motion.div variants={rise} initial="hidden" animate="show" custom={0.24} className="mt-9 max-w-2xl">
            <div className="group flex items-center gap-3 bg-panel border border-line2 rounded-2xl px-5 py-[18px] focus-within:border-acid/70 focus-within:shadow-[0_0_0_4px_rgba(205,255,61,0.08)] transition-all">
              <Search size={19} className="text-fog group-focus-within:text-acid transition-colors shrink-0" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (e.target.value.trim().length === 1) gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && filtered[0]) nav(`/tool/${filtered[0].id}`); }}
                placeholder={`Search ${TOOLS.length} tools — try "qr", "bmi", "json", "timer"…`}
                className="flex-1 bg-transparent text-[15.5px] outline-none placeholder:text-fog/45 text-cream min-w-0"
              />
              <button onClick={openPalette} className="hidden sm:flex items-center gap-1 shrink-0 text-fog/70 hover:text-cream transition-colors cursor-pointer">
                <kbd className="key">⌘</kbd><kbd className="key">K</kbd>
              </button>
            </div>
            {q.trim() && (
              <div className="mt-2.5 text-[12px] font-mono2 text-fog pl-1">
                <span className="text-acid">{filtered.length}</span> tool{filtered.length === 1 ? "" : "s"} found{filtered[0] && <> — press <kbd className="key">↵</kbd> to open <span className="text-cream">{filtered[0].name}</span></>}
              </div>
            )}
            {!q.trim() && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[11px] font-mono2 uppercase tracking-widest text-fog/60 py-2">Trending:</span>
                {["qr-code-generator", "password-generator", "json-formatter", "bmi-calculator", "pomodoro-timer", "word-counter"].map((id) => {
                  const t = TOOLS.find((x) => x.id === id)!;
                  return (
                    <Link key={id} to={`/tool/${id}`} className="text-[12px] px-3.5 py-2 rounded-full border border-line text-fog hover:text-ink hover:bg-acid hover:border-acid transition-all">
                      {t.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── MARQUEE ──────────────────────────────── */}
      <div className="border-y border-line py-3.5 overflow-hidden bg-panel/40 select-none" aria-hidden>
        <div className="marquee-track flex whitespace-nowrap gap-0 w-max">
          {marquee.map((n, i) => (
            <span key={i} className="font-mono2 text-[12px] uppercase tracking-[0.18em] text-fog/60 flex items-center">
              <span className="px-5">{n}</span>
              <Sparkle size={10} className="text-acid/50 shrink-0" />
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 py-12 grid grid-cols-2 sm:grid-cols-4 gap-y-8">
        {[[TOOLS.length + "", "free tools"], [CATEGORIES.length + "", "categories"], ["0", "sign-ups required"], ["100%", "runs in your browser"]].map(([v, k]) => (
          <motion.div key={k} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="font-mono2 text-4xl sm:text-5xl font-bold text-cream">{v}</div>
            <div className="mt-1.5 text-[11px] font-mono2 uppercase tracking-[0.2em] text-fog">{k}</div>
          </motion.div>
        ))}
      </section>

      {/* ── POPULAR ──────────────────────────────── */}
      {!filtering && (
        <section className="max-w-6xl mx-auto px-5 pb-4">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-2xl font-bold tracking-tight">Most used <span className="font-serifit italic text-acid font-normal">this week</span></h2>
            <span className="font-mono2 text-[11px] text-fog">01 — 06</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popular.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: i * 0.05 }}>
                <Link to={`/tool/${t.id}`} className="tool-card group relative block h-44 bg-panel border border-line rounded-2xl overflow-hidden hover:border-acid/0">
                  <div className="sweep absolute inset-0 bg-acid" />
                  <div className="relative h-full p-6 flex flex-col">
                    <div className="flex items-start justify-between">
                      <span className="card-icon card-icon-chip w-10 h-10 grid place-items-center rounded-xl bg-panel2 border border-line text-fog"><t.icon size={18} strokeWidth={2} /></span>
                      <span className="card-num font-mono2 text-[11px] text-fog/50">{String(i + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="mt-auto">
                      <div className="card-name text-[17px] font-semibold tracking-tight text-cream">{t.name}</div>
                      <div className="card-desc mt-1 text-[12.5px] leading-snug text-fog line-clamp-2 pr-6">{t.desc}</div>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="card-arrow absolute bottom-5 right-5 text-ink" />
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── INDEX ────────────────────────────────── */}
      <section ref={gridRef} className="max-w-6xl mx-auto px-5 pt-12 pb-24 scroll-mt-20">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-2xl font-bold tracking-tight">{filtering ? "Results" : "The full index"}</h2>
          <span className="font-mono2 text-[11px] text-fog">{filtered.length} shown</span>
        </div>

        {/* category chips */}
        <div className="sticky top-[57px] z-30 -mx-5 px-5 py-3 bg-ink/85 backdrop-blur-lg mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {[{ id: "all", label: "All" }, { id: "popular", label: "★ Popular" }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))].map((c) => {
              const count = c.id === "all" ? TOOLS.length : c.id === "popular" ? TOOLS.filter((t) => t.featured).length : TOOLS.filter((t) => t.category === c.id).length;
              const active = cat === c.id;
              return (
                <button key={c.id} onClick={() => setCat(c.id)}
                  className={cx("shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-medium border transition-all cursor-pointer",
                    active ? "bg-acid text-ink border-acid" : "border-line text-fog hover:text-cream hover:border-line2")}>
                  {c.label}
                  <span className={cx("font-mono2 text-[10px]", active ? "text-ink/60" : "text-fog/50")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="ghost-num font-bold text-[80px] font-mono2 leading-none">0</div>
            <p className="mt-4 text-fog">No tools match <span className="text-cream font-mono2">“{q}”</span></p>
            <button onClick={() => { setQ(""); setCat("all"); }} className="mt-5 text-[13px] text-acid hover:underline cursor-pointer">Clear search & filters</button>
          </div>
        ) : (
          <motion.div key={cat + q + filtered.length} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.012 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((t, i) => (
              <motion.div key={t.id} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } }}>
                <ToolCard t={t} i={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* ── CTA strip ────────────────────────────── */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-20 text-center">
          <p className="font-mono2 text-[11px] uppercase tracking-[0.25em] text-fog">built for speed</p>
          <h2 className="mt-4 text-4xl sm:text-6xl font-bold tracking-[-0.03em]">
            Open. Solve. <span className="font-serifit italic font-normal text-acid">Close tab.</span>
          </h2>
          <p className="mt-5 max-w-md mx-auto text-[14.5px] text-fog leading-relaxed">
            Everything computes locally on your device. Your text, files and secrets never leave the browser — that's the whole point.
          </p>
          <button onClick={openPalette} className="mt-8 inline-flex items-center gap-2.5 bg-acid text-ink font-semibold text-[14px] px-7 py-3.5 rounded-2xl hover:shadow-[0_0_40px_-8px_rgba(205,255,61,0.6)] transition-all cursor-pointer active:scale-95">
            <Search size={16} /> Find a tool — ⌘K
          </button>
        </div>
      </section>
    </div>
  );
}
