import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { catOf, TOOLS } from "../tools/registry";

export function ToolPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const tool = TOOLS.find((t) => t.id === id);
  const idx = TOOLS.findIndex((t) => t.id === id);
  const prev = TOOLS[(idx - 1 + TOOLS.length) % TOOLS.length];
  const next = TOOLS[(idx + 1) % TOOLS.length];
  const related = tool
    ? [
        ...(tool.related || []).map((rid) => TOOLS.find((t) => t.id === rid)).filter((t): t is NonNullable<typeof t> => !!t && t.id !== tool.id),
        ...TOOLS.filter((t) => t.category === tool.category && t.id !== tool.id),
      ].filter((t, i, arr) => arr.indexOf(t) === i).slice(0, 4)
    : [];

  useEffect(() => {
    document.title = tool ? `${tool.name} — Toolbox` : "Toolbox — 81 Free Online Tools";
    return () => { document.title = "Toolbox — 81 Free Online Tools That Just Work"; };
  }, [tool]);

  if (!tool) {
    return (
      <div className="pt-40 pb-32 text-center px-5">
        <div className="ghost-num font-mono2 text-[100px] font-bold leading-none">404</div>
        <p className="mt-4 text-fog">That tool doesn't exist (yet).</p>
        <Link to="/" className="mt-6 inline-block text-acid text-[14px] hover:underline">← Browse all {TOOLS.length} tools</Link>
      </div>
    );
  }

  const Icon = tool.icon;
  const cat = catOf(tool.category);

  return (
    <div className="pt-24 sm:pt-28 pb-16 px-5">
      <div className="max-w-4xl mx-auto">
        {/* breadcrumb */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/" className="inline-flex items-center gap-2 text-[12.5px] font-mono2 text-fog hover:text-acid transition-colors">
            <ArrowLeft size={14} /> all tools
          </Link>
        </motion.div>

        {/* header */}
        <motion.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }} className="mt-7 relative">
          <div aria-hidden className="absolute -top-24 -right-10 font-mono2 font-bold text-[160px] leading-none ghost-num select-none hidden lg:block">
            {String(idx + 1).padStart(3, "0")}
          </div>
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 grid place-items-center rounded-2xl bg-acid text-ink">
                <Icon size={22} strokeWidth={2.2} />
              </span>
              <span className="font-mono2 text-[10.5px] uppercase tracking-[0.22em] text-fog border border-line rounded-full px-3.5 py-1.5">
                {cat.label} · {String(idx + 1).padStart(3, "0")}/{TOOLS.length}
              </span>
            </div>
            <h1 className="mt-5 text-4xl sm:text-[54px] font-bold tracking-[-0.03em] leading-[1.02]">{tool.name}</h1>
            <p className="mt-3.5 max-w-lg text-[15px] leading-relaxed text-fog">{tool.desc}</p>
          </div>
        </motion.header>

        {/* workspace */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 bg-panel border border-line rounded-3xl p-5 sm:p-7 relative overflow-hidden">
          <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-acid/50 to-transparent" />
          <tool.Component />
        </motion.div>

        {/* privacy note — driven by the registry's processing field */}
        <p className="mt-5 text-center text-[11px] font-mono2 text-fog/60 tracking-wide">
          {tool.processing === "server"
            ? "⏤ this one converts via a server round-trip · not for sensitive files ⏤"
            : "⏤ runs 100% in your browser · nothing is uploaded ⏤"}
        </p>

        {/* related */}
        {related.length > 0 && (
          <div className="mt-14">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-bold tracking-tight">More in {cat.label.toLowerCase()}</h2>
              <Link to="/" className="text-[12px] font-mono2 text-fog hover:text-acid transition-colors">view all →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {related.map((t) => (
                <Link key={t.id} to={`/tool/${t.id}`} className="tool-card group relative block bg-panel border border-line rounded-2xl overflow-hidden p-4 h-32 hover:border-acid/0">
                  <div className="sweep absolute inset-0 bg-acid" />
                  <div className="relative h-full flex flex-col">
                    <span className="card-icon text-fog"><t.icon size={16} /></span>
                    <div className="mt-auto">
                      <div className="card-name text-[13.5px] font-semibold text-cream leading-tight">{t.name}</div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="card-arrow absolute bottom-3.5 right-3.5 text-ink" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* prev / next */}
        <div className="mt-10 grid grid-cols-2 gap-3">
          <button onClick={() => nav(`/tool/${prev.id}`)} className="group flex items-center gap-3 border border-line rounded-2xl p-4 hover:border-acid/40 transition-colors text-left cursor-pointer bg-panel/50">
            <ArrowLeft size={16} className="text-fog group-hover:text-acid group-hover:-translate-x-1 transition-all shrink-0" />
            <span className="min-w-0">
              <span className="block text-[10px] font-mono2 uppercase tracking-widest text-fog">prev</span>
              <span className="block text-[13.5px] font-semibold text-cream truncate">{prev.name}</span>
            </span>
          </button>
          <button onClick={() => nav(`/tool/${next.id}`)} className="group flex items-center justify-end gap-3 border border-line rounded-2xl p-4 hover:border-acid/40 transition-colors text-right cursor-pointer bg-panel/50">
            <span className="min-w-0">
              <span className="block text-[10px] font-mono2 uppercase tracking-widest text-fog">next</span>
              <span className="block text-[13.5px] font-semibold text-cream truncate">{next.name}</span>
            </span>
            <ArrowRight size={16} className="text-fog group-hover:text-acid group-hover:translate-x-1 transition-all shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
