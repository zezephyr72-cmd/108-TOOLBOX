import { useEffect, useState } from "react";
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Command, Wrench } from "lucide-react";
import { Home } from "./pages/Home";
import { ToolPage } from "./pages/ToolPage";
import { CommandPalette } from "./components/CommandPalette";
import { Toaster } from "./lib/fileui";
import { CATEGORIES, TOOLS } from "./tools/registry";
import { cx } from "./lib/ui";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [pathname]);
  return null;
}

function Nav({ onSearch }: { onSearch: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header className={cx("fixed top-0 inset-x-0 z-50 transition-all duration-300", scrolled ? "bg-ink/85 backdrop-blur-xl border-b border-line" : "bg-transparent")}>
      <div className="max-w-6xl mx-auto px-5 h-[57px] flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-8 h-8 grid place-items-center rounded-[10px] bg-acid text-ink transition-transform group-hover:rotate-[-12deg]">
            <Wrench size={16} strokeWidth={2.5} />
          </span>
          <span className="font-bold tracking-tight text-[16.5px]">Toolbox</span>
          <span className="font-mono2 text-[10px] text-fog border border-line rounded-full px-2 py-0.5 mt-0.5">{TOOLS.length}</span>
        </Link>
        <div className="flex-1" />
        <button
          onClick={onSearch}
          className="flex items-center gap-2.5 border border-line rounded-xl pl-3.5 pr-2.5 py-2 text-fog hover:text-cream hover:border-line2 transition-all cursor-pointer bg-panel/60"
        >
          <span className="text-[12.5px]">Search tools…</span>
          <span className="hidden sm:flex items-center gap-1"><kbd className="key"><Command size={9} /></kbd><kbd className="key">K</kbd></span>
        </button>
      </div>
    </header>
  );
}

function Footer() {
  const popular = TOOLS.filter((t) => t.featured).slice(0, 8);
  return (
    <footer className="border-t border-line relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 pt-16 pb-8 relative">
        <div className="grid sm:grid-cols-[1.2fr_1fr_1fr] gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="w-8 h-8 grid place-items-center rounded-[10px] bg-acid text-ink"><Wrench size={16} strokeWidth={2.5} /></span>
              <span className="font-bold tracking-tight text-[16.5px]">Toolbox</span>
            </Link>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-fog">
              {TOOLS.length} utility tools with zero sign-up, zero uploads and zero nonsense. Everything runs locally in your browser.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-mono2 uppercase tracking-[0.2em] text-fog mb-4">Categories</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {CATEGORIES.map((c) => <Link key={c.id} to={`/?c=${c.id}`} className="text-[13px] text-fog hover:text-acid transition-colors">{c.label}</Link>)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-mono2 uppercase tracking-[0.2em] text-fog mb-4">Popular</div>
            <div className="grid gap-y-2.5">
              {popular.map((t) => <Link key={t.id} to={`/tool/${t.id}`} className="text-[13px] text-fog hover:text-acid transition-colors">{t.name}</Link>)}
            </div>
          </div>
        </div>
        <div className="mt-14 select-none" aria-hidden>
          <div className="text-outline font-bold tracking-[-0.02em] leading-[0.85] text-[clamp(80px,17vw,220px)] whitespace-nowrap">TOOLBOX</div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[11.5px] font-mono2 text-fog/70">
          <span>© {new Date().getFullYear()} Toolbox — {TOOLS.length} tools</span>
          <span>no cookies · no tracking · no servers</span>
          <span>press <kbd className="key">⌘K</kbd> anywhere</span>
        </div>
      </div>
    </footer>
  );
}

function Shell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  const location = useLocation();
  return (
    <div className="grain min-h-screen flex flex-col">
      <Nav onSearch={() => setPaletteOpen(true)} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <Routes location={location}>
              <Route path="/" element={<Home openPalette={() => setPaletteOpen(true)} />} />
              <Route path="/tool/:id" element={<ToolPage />} />
              <Route path="*" element={<ToolPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Shell />
    </HashRouter>
  );
}
