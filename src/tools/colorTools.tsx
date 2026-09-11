/* ── 5 Color tools ─────────────────────────────────────────────── */
import { useEffect, useMemo, useState } from "react";
import { Pipette, Contrast, Palette, Brush, Grid2x2, Lock, RefreshCw, Plus, X } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, CopyBtn, In, L, Panel, Seg, Toggle, useCopy, cx } from "../lib/ui";
import { hexToRgb, rgbToHex, rgbToHsl, hslToHex, contrastRatio, mix, randHex } from "../lib/color";

/* 1 ─ Color converter */
function Converter() {
  const [rgb, setRgb] = useState<[number, number, number]>([205, 255, 61]);
  const hex = rgbToHex(...rgb);
  const [h, s, l] = rgbToHsl(...rgb);
  const [hexIn, setHexIn] = useState(hex);
  const setChannel = (space: "rgb" | "hsl", i: number, v: string) => {
    const n = Math.max(0, parseFloat(v) || 0);
    if (space === "rgb") { const c: [number, number, number] = [...rgb]; c[i] = Math.min(255, n); setRgb(c); setHexIn(rgbToHex(...c)); }
    else {
      const hsl: [number, number, number] = [h, s, l];
      hsl[i] = i === 0 ? n % 360 : Math.min(100, n);
      const [r2, g2, b2] = hslToRgb2(...hsl);
      setRgb([r2, g2, b2]); setHexIn(rgbToHex(r2, g2, b2));
    }
  };
  const hslToRgb2 = (hh: number, ss: number, ll: number) => { const x = hexToRgb(hslToHex(hh, ss, ll))!; return x; };
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  return (
    <div className="space-y-5">
      <div className="h-32 rounded-2xl border border-line relative overflow-hidden" style={{ background: hex }}>
        <span className="absolute bottom-3 left-4 font-mono2 text-sm font-bold px-2 py-0.5 rounded" style={{ color: lum > 0.5 ? "#000" : "#fff" }}>{hex.toUpperCase()}</span>
      </div>
      <div className="flex items-center gap-3">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(hexIn) ? hexIn : hex} onChange={(e) => { const c = hexToRgb(e.target.value)!; setRgb(c); setHexIn(e.target.value); }} className="w-14 h-14 rounded-xl cursor-pointer bg-transparent" />
        <In value={hexIn} onChange={(e) => { setHexIn(e.target.value); const c = hexToRgb(e.target.value); if (c) setRgb(c); }} className="font-mono2 !text-lg" />
        <CopyBtn text={hex.toUpperCase()} id="hex" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Panel>
          <L>RGB</L>
          {(["r", "g", "b"] as const).map((ch, i) => (
            <div key={ch} className="flex items-center gap-2 py-1.5">
              <span className="font-mono2 text-[12px] text-fog w-4 uppercase">{ch}</span>
              <input type="range" className="slider flex-1" min={0} max={255} value={rgb[i]} onChange={(e) => setChannel("rgb", i, e.target.value)} />
              <span className="font-mono2 text-[12px] text-cream w-8 text-right">{Math.round(rgb[i])}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between"><code className="font-mono2 text-[12.5px] text-acid">rgb({rgb.map(Math.round).join(", ")})</code><CopyBtn text={`rgb(${rgb.map(Math.round).join(", ")})`} id="rgb" label="" /></div>
        </Panel>
        <Panel>
          <L>HSL</L>
          {([["h", 360], ["s", 100], ["l", 100]] as const).map(([ch, max], i) => (
            <div key={ch} className="flex items-center gap-2 py-1.5">
              <span className="font-mono2 text-[12px] text-fog w-4 uppercase">{ch}</span>
              <input type="range" className="slider flex-1" min={0} max={max} value={i === 0 ? h : i === 1 ? s : l} onChange={(e) => setChannel("hsl", i, e.target.value)} />
              <span className="font-mono2 text-[12px] text-cream w-8 text-right">{Math.round(i === 0 ? h : i === 1 ? s : l)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between"><code className="font-mono2 text-[12.5px] text-acid">hsl({Math.round(h)}, {Math.round(s)}%, {Math.round(l)}%)</code><CopyBtn text={`hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`} id="hsl" label="" /></div>
        </Panel>
      </div>
    </div>
  );
}

/* 2 ─ Contrast checker */
function Badge({ ok, label }: { ok: boolean; label: string }) {
  return <span className={cx("font-mono2 text-[11px] px-2.5 py-1 rounded-full border", ok ? "border-acid/40 text-acid bg-acid/10" : "border-red-400/30 text-red-400/80 bg-red-400/5")}>{label} {ok ? "✓" : "✕"}</span>;
}
function ContrastTool() {
  const [fg, setFg] = useState("#0a0b0d");
  const [bg, setBg] = useState("#cdff3d");
  const ratio = contrastRatio(fg, bg);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {([["Text", fg, setFg], ["Background", bg, setBg]] as const).map(([lbl, val, set]) => (
          <div key={lbl}>
            <L>{lbl}</L>
            <div className="flex gap-2 items-center">
              <input type="color" value={val} onChange={(e) => set(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent shrink-0" />
              <In value={val} onChange={(e) => { if (hexToRgb(e.target.value)) set(e.target.value); else set(e.target.value); }} className="font-mono2 !text-[13px]" />
            </div>
          </div>
        ))}
      </div>
      <Panel className="text-center !py-8">
        <div className="text-6xl font-bold font-mono2 tabular-nums" style={{ color: ratio >= 4.5 ? "#cdff3d" : ratio >= 3 ? "#fbbf24" : "#f87171" }}>{ratio.toFixed(2)}<span className="text-2xl text-fog">:1</span></div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Badge ok={ratio >= 3} label="AA large" /><Badge ok={ratio >= 4.5} label="AA normal" />
          <Badge ok={ratio >= 4.5} label="AAA large" /><Badge ok={ratio >= 7} label="AAA normal" />
        </div>
      </Panel>
      <div className="rounded-2xl p-6 space-y-3 border border-line" style={{ background: bg }}>
        <p className="text-2xl font-bold" style={{ color: fg }}>Large headline looks like this</p>
        <p className="text-[15px]" style={{ color: fg }}>Body copy at 16px looks like this. Can people actually read it, or is it just pretty in your mockup?</p>
        <p className="text-[12px]" style={{ color: fg }}>Small print at 12px — the true stress test.</p>
      </div>
    </div>
  );
}

/* 3 ─ Palette generator */
type Harmony = "analogous" | "complement" | "triadic" | "mono" | "split";
function PaletteGen() {
  const [mode, setMode] = useState<Harmony>("analogous");
  const [colors, setColors] = useState<{ hex: string; locked: boolean }[]>([]);
  const [, copy] = useCopy();
  const build = (prev: { hex: string; locked: boolean }[]) => {
    const out = [...prev];
    while (out.length < 5) out.push({ hex: randHex(), locked: false });
    const lockedIdx = out.findIndex((c) => c.locked);
    const base = lockedIdx >= 0 ? out[lockedIdx].hex : randHex();
    const [hb, sb, lb] = (() => { const c = hexToRgb(base)!; return rgbToHsl(...c); })();
    const gen: Record<Harmony, string[]> = {
      analogous: [-40, -20, 0, 20, 40].map((off) => hslToHex(hb + off, Math.min(90, sb + 8), Math.max(28, Math.min(72, lb + off / 4)))),
      complement: [hb, hb, hb + 180, hb + 180, hb].map((hh, i) => hslToHex(hh, [70, 35, 75, 40, 90][i], [45, 75, 42, 78, 25][i])),
      triadic: [hb, hb + 120, hb, hb + 240, hb].map((hh, i) => hslToHex(hh, [75, 70, 40, 70, 85][i], [50, 45, 74, 45, 30][i])),
      mono: [18, 32, 46, 60, 76].map((ll) => hslToHex(hb, Math.min(95, sb + 5), ll)),
      split: [hb, hb + 150, hb + 210, hb, hb + 180].map((hh, i) => hslToHex(hh, [70, 65, 65, 30, 55][i], [48, 42, 48, 74, 28][i])),
    };
    return out.map((c, i) => (c.locked ? c : { hex: gen[mode][i], locked: false }));
  };
  useEffect(() => { setColors((c) => build(c)); /* eslint-disable-next-line */ }, [mode]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) { e.preventDefault(); setColors((c) => build(c)); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    /* eslint-disable-next-line */
  }, [mode]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Seg options={(["analogous", "complement", "triadic", "mono", "split"] as Harmony[]).map((h2) => ({ v: h2, label: h2 === "mono" ? "monochrome" : h2 === "split" ? "split-comp" : h2 }))} value={mode} onChange={setMode} />
        <Btn v="acid" onClick={() => setColors((c) => build(c))}><RefreshCw size={14} /> Space</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 h-64 sm:h-72">
        {colors.map((c, i) => (
          <div key={i} className="rounded-2xl relative group flex flex-col justify-end p-3 cursor-pointer transition-transform hover:-translate-y-1" style={{ background: c.hex }} onClick={() => copy(c.hex, `p${i}`)}>
            <button onClick={(e) => { e.stopPropagation(); setColors(colors.map((x, j) => j === i ? { ...x, locked: !x.locked } : x)); }}
              className={cx("absolute top-2.5 right-2.5 p-1.5 rounded-lg transition-all", c.locked ? "bg-black/40 text-acid" : "bg-black/25 text-white/60 opacity-0 group-hover:opacity-100")}>
              <Lock size={12} />
            </button>
            <span className="font-mono2 text-[11px] font-bold uppercase" style={{ color: contrastRatio(c.hex, "#000000") > 4 ? "#000" : "#fff" }}>{c.hex}</span>
          </div>
        ))}
      </div>
      <p className="text-[12px] font-mono2 text-fog/70">click a swatch to copy · lock colors you love · press space for a fresh palette</p>
      <Out value={`:root {\n${colors.map((c, i) => `  --color-${(i + 1) * 100}: ${c.hex};`).join("\n")}\n}`} />
    </div>
  );
}
function Out({ value }: { value: string }) {
  const [copied, copy] = useCopy();
  return (
    <button onClick={() => copy(value, "cssvars")} className="w-full text-left bg-ink/70 border border-line rounded-xl px-4 py-3 font-mono2 text-[12px] text-fog hover:border-acid/40 transition-colors cursor-pointer whitespace-pre">
      {value}
      <span className="block mt-2 text-acid text-[10px] uppercase tracking-widest">{copied === "cssvars" ? "copied ✓" : "click to copy css variables"}</span>
    </button>
  );
}

/* 4 ─ Gradient maker */
function Gradient() {
  const [stops, setStops] = useState([{ c: "#cdff3d", p: 0 }, { c: "#3dd6ff", p: 100 }]);
  const [angle, setAngle] = useState(120);
  const [radial, setRadial] = useState(false);
  const css = `background: ${radial ? "radial-gradient(circle" : `linear-gradient(${angle}deg`}, ${stops.map((s) => `${s.c} ${s.p}%`).join(", ")});`;
  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-5 items-start">
      <div className="h-72 md:h-96 rounded-2xl border border-line" style={radial ? { background: `radial-gradient(circle, ${stops.map((s) => `${s.c} ${s.p}%`).join(", ")})` } : { background: `linear-gradient(${angle}deg, ${stops.map((s) => `${s.c} ${s.p}%`).join(", ")})` }} />
      <div className="space-y-4">
        <Toggle on={radial} onChange={setRadial} label="Radial" />
        {!radial && <div><L hint={`${angle}°`}>Angle</L><input type="range" className="slider" min={0} max={360} value={angle} onChange={(e) => setAngle(+e.target.value)} /></div>}
        <div className="space-y-2.5">
          {stops.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <input type="color" value={s.c} onChange={(e) => setStops(stops.map((x, j) => j === i ? { ...x, c: e.target.value } : x))} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent shrink-0" />
              <input type="range" className="slider flex-1" min={0} max={100} value={s.p} onChange={(e) => setStops(stops.map((x, j) => j === i ? { ...x, p: +e.target.value } : x))} />
              <span className="font-mono2 text-[11px] text-fog w-9 text-right">{s.p}%</span>
              {stops.length > 2 && <button onClick={() => setStops(stops.filter((_, j) => j !== i))} className="text-fog hover:text-red-400 cursor-pointer p-1 shrink-0"><X size={14} /></button>}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {stops.length < 6 && <Btn v="soft" onClick={() => setStops([...stops, { c: randHex(), p: Math.round((stops[stops.length - 1].p + 100) / 2) }])}><Plus size={14} /> Stop</Btn>}
          <Btn v="soft" onClick={() => setStops([{ c: randHex(), p: 0 }, ...Array.from({ length: stops.length - 1 }, (_, i) => ({ c: randHex(), p: Math.round(((i + 1) / (stops.length - 1)) * 100) }))])}><RefreshCw size={14} /> Random</Btn>
        </div>
        <div><L>CSS</L><code className="block bg-ink/70 border border-line rounded-xl px-4 py-3 font-mono2 text-[12px] text-acid break-all">{css}</code><div className="mt-2"><CopyBtn text={css} id="grad" label="Copy CSS" /></div></div>
      </div>
    </div>
  );
}

/* 5 ─ Shade scale */
function Shades() {
  const [hex, setHex] = useState("#cdff3d");
  const steps = useMemo(() => {
    const names = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    return names.map((n) => {
      const t = n <= 500 ? 1 - n / 500 : 0; // toward white
      const d = n > 500 ? (n - 500) / 450 : 0; // toward black
      return { n, hex: n <= 500 ? mix(hex, "#ffffff", t) : mix(hex, "#050505", d * 0.92) };
    });
  }, [hex]);
  const [, copy] = useCopy();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent" />
        <In value={hex} onChange={(e) => { if (hexToRgb(e.target.value)) setHex(e.target.value); }} className="font-mono2 w-36" />
      </div>
      <div className="rounded-2xl overflow-hidden border border-line">
        <div className="flex h-24">{steps.map((s) => <div key={s.n} className="flex-1" style={{ background: s.hex }} />)}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {steps.map((s) => (
          <button key={s.n} onClick={() => copy(s.hex, `s${s.n}`)} className="rounded-xl p-3 text-left transition-transform hover:-translate-y-0.5 cursor-pointer" style={{ background: s.hex }}>
            <div className="font-mono2 text-[10px] font-bold" style={{ color: contrastRatio(s.hex, "#000000") > 3.5 ? "#00000088" : "#ffffff88" }}>{s.n}</div>
            <div className="font-mono2 text-[12px] font-bold" style={{ color: contrastRatio(s.hex, "#000000") > 3.5 ? "#000" : "#fff" }}>{s.hex}</div>
          </button>
        ))}
      </div>
      <p className="text-[12px] font-mono2 text-fog/70">tailwind-style 50–950 scale · click any shade to copy</p>
    </div>
  );
}

export const colorTools: ToolDef[] = [
  { id: "color-converter", name: "Color Converter", desc: "HEX ↔ RGB ↔ HSL with sliders and instant copy chips.", category: "color", icon: Pipette, keywords: ["hex to rgb", "hsl", "color picker", "css color"], featured: true, Component: Converter },
  { id: "contrast-checker", name: "Contrast Checker", desc: "WCAG AA/AAA scores with real text previews at every size.", category: "color", icon: Contrast, keywords: ["wcag", "accessibility", "a11y", "readable text"], Component: ContrastTool },
  { id: "palette-generator", name: "Palette Generator", desc: "Five-color harmony schemes — lock favorites, press space, repeat.", category: "color", icon: Palette, keywords: ["color scheme", "color palette", "coolors alternative"], featured: true, Component: PaletteGen },
  { id: "gradient-generator", name: "Gradient Generator", desc: "Multi-stop linear & radial gradients with clean CSS output.", category: "color", icon: Brush, keywords: ["css gradient", "linear gradient", "background maker"], Component: Gradient },
  { id: "shade-scale", name: "Shade Scale", desc: "Turn one color into a full 50–950 design-token ramp.", category: "color", icon: Grid2x2, keywords: ["color shades", "tints tones", "design tokens", "tailwind palette"], Component: Shades },
];
