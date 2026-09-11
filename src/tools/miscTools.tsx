/* ── 5 Everyday tools ──────────────────────────────────────────── */
import { useEffect, useRef, useState } from "react";
import { Volume2, Monitor, CircleDollarSign, Dice5, Lightbulb, Play, Square, RefreshCw } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, L, Panel, Row, Seg, Sel, Stat, TA, cx } from "../lib/ui";

/* 1 ─ Text to speech */
function TTS() {
  const [t, setT] = useState("The quick brown fox jumps over the lazy dog. Welcome to Toolbox — eighty one tools, zero signups.");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() || []);
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);
  const speak = () => {
    if (!t.trim() || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    const v = voices.find((x) => x.name === voice);
    if (v) u.voice = v;
    u.rate = rate; u.pitch = pitch;
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };
  const stop = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} className="min-h-32" />
      <div className="grid sm:grid-cols-2 gap-3">
        <div><L hint={voices.length ? `${voices.length} voices available` : "voices loading…"}>Voice</L>
          <Sel value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">System default</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </Sel>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><L hint={`${rate}×`}>Speed</L><input type="range" className="slider mt-4" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} /></div>
          <div><L hint={String(pitch)}>Pitch</L><input type="range" className="slider mt-4" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(+e.target.value)} /></div>
        </div>
      </div>
      <div className="flex gap-2.5">
        <Btn v="acid" onClick={speaking ? stop : speak} className="flex-1 !py-3.5">{speaking ? <><Square size={14} /> Stop</> : <><Play size={14} /> Speak aloud</>}</Btn>
      </div>
      {!window.speechSynthesis && <p className="text-[12px] font-mono2 text-red-400">Your browser doesn't support speech synthesis.</p>}
    </div>
  );
}

/* 2 ─ Screen info */
function ScreenInfo() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const r = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("resize", r);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("resize", r); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Unknown";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Unknown";
  const device = size.w < 640 ? "phone-sized" : size.w < 1024 ? "tablet-sized" : "desktop";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Viewport" value={`${size.w}×${size.h}`} accent />
        <Stat label="Screen" value={`${screen.width}×${screen.height}`} />
        <Stat label="Pixel ratio" value={`${window.devicePixelRatio}×`} />
        <Stat label="Color depth" value={`${screen.colorDepth}-bit`} />
      </div>
      <Panel>
        <Row k="Browser (guess)" v={browser} /><Row k="OS (guess)" v={os} /><Row k="Device class" v={device} />
        <Row k="Touch points" v={String(navigator.maxTouchPoints)} />
        <Row k="Language" v={navigator.language} />
        <Row k="Online" v={online ? "yes ✓" : "offline"} />
        <Row k="Cookies" v={navigator.cookieEnabled ? "enabled" : "blocked"} />
        <Row k="Screen orientation" v={screen.orientation?.type?.replace("-", " ") || "—"} />
      </Panel>
      <p className="text-[11.5px] font-mono2 text-fog/60">resize the window — the viewport stat updates live</p>
    </div>
  );
}

/* 3 ─ Coin flip */
function CoinFlip() {
  const [flipping, setFlipping] = useState(false);
  const [face, setFace] = useState<"H" | "T">("H");
  const [tally, setTally] = useState({ H: 0, T: 0 });
  const [hist, setHist] = useState<string[]>([]);
  const flip = () => {
    if (flipping) return;
    setFlipping(true);
    const result: "H" | "T" = Math.random() < 0.5 ? "H" : "T";
    let i = 0;
    const iv = setInterval(() => {
      setFace(i % 2 ? "T" : "H");
      if (++i >= 12) {
        clearInterval(iv);
        setFace(result);
        setTally((t) => ({ ...t, [result]: t[result] + 1 }));
        setHist((h) => [result, ...h].slice(0, 24));
        setFlipping(false);
      }
    }, 90);
  };
  return (
    <div className="space-y-5">
      <Panel className="text-center !py-10">
        <button onClick={flip} className={cx("mx-auto w-36 h-36 rounded-full grid place-items-center text-4xl font-bold font-mono2 transition-transform cursor-pointer border-4",
          face === "H" ? "bg-acid text-ink border-acid/60" : "bg-panel2 text-cream border-line2", flipping && "coin-flipping")} style={{ transformStyle: "preserve-3d" }}>
          {flipping ? "?" : face === "H" ? "H" : "T"}
        </button>
        <div className="mt-5 text-[12px] font-mono2 text-fog">{flipping ? "flipping…" : face === "H" ? "HEADS" : "TAILS"} — click the coin to flip</div>
      </Panel>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Heads" value={tally.H} /><Stat label="Tails" value={tally.T} />
      </div>
      {hist.length > 0 && <div className="flex flex-wrap gap-1.5">{hist.map((h, i) => <span key={i} className={cx("font-mono2 text-[11px] w-7 h-7 grid place-items-center rounded-lg border", h === "H" ? "bg-acid/15 border-acid/30 text-acid" : "bg-panel2 border-line text-fog")}>{h}</span>)}</div>}
    </div>
  );
}

/* 4 ─ Dice roller */
function Dice() {
  const [sides, setSides] = useState(6);
  const [count, setCount] = useState(2);
  const [vals, setVals] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const [hist, setHist] = useState<string[]>([]);
  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let i = 0;
    const iv = setInterval(() => {
      setVals(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides)));
      if (++i >= 8) {
        clearInterval(iv);
        const final = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
        setVals(final);
        setHist((h) => [`${final.join("+")}=${final.reduce((a, b) => a + b, 0)}`, ...h].slice(0, 12));
        setRolling(false);
      }
    }, 70);
  };
  const total = vals.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Seg options={[4, 6, 8, 10, 12, 20, 100].map((n) => ({ v: String(n) as "6" | "20", label: `d${n}` }))} value={String(sides) as "6" | "20"} onChange={(v) => setSides(+v)} />
        <Sel value={count} onChange={(e) => setCount(+e.target.value)} className="!w-24">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} dice</option>)}</Sel>
      </div>
      <Panel className="!py-10">
        <div className="flex flex-wrap justify-center gap-3">
          {(vals.length ? vals : Array.from({ length: count }, () => sides)).map((v, i) => (
            <div key={i} className={cx("w-16 h-16 sm:w-20 sm:h-20 rounded-2xl grid place-items-center font-mono2 text-2xl font-bold bg-panel2 border border-line2 text-cream", rolling && "dice-shaking")}>{v}</div>
          ))}
        </div>
        {vals.length > 0 && !rolling && <div className="mt-6 text-center font-mono2 text-[13px] text-fog">total <span className="text-acid text-xl font-bold">{total}</span></div>}
      </Panel>
      <Btn v="acid" onClick={roll} className="w-full !py-3.5"><RefreshCw size={15} /> Roll d{sides}{count > 1 ? ` × ${count}` : ""}</Btn>
      {hist.length > 0 && <div className="flex flex-wrap gap-1.5">{hist.map((h, i) => <span key={i} className="font-mono2 text-[11px] px-2 py-1 rounded-lg bg-panel2 border border-line text-fog">{h}</span>)}</div>}
    </div>
  );
}

/* 5 ─ Decision maker */
function Decision() {
  const [opts, setOpts] = useState("Pizza\nSushi\nTacos\nRamen");
  const [picking, setPicking] = useState(false);
  const [result, setResult] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const pick = () => {
    const list = opts.split("\n").map((s) => s.trim()).filter(Boolean);
    if (list.length === 0 || picking) return;
    setPicking(true);
    let i = 0;
    const iv = setInterval(() => {
      setResult(list[Math.floor(Math.random() * list.length)]);
      if (++i >= 18) {
        clearInterval(iv);
        const final = list[Math.floor(Math.random() * list.length)];
        setTimeout(() => { setResult(final); setPicking(false); }, 120);
        setResult(final);
      }
    }, 80 + i * 4);
  };
  return (
    <div className="space-y-4">
      <L hint="one option per line">What are you choosing between?</L>
      <TA value={opts} onChange={(e) => setOpts(e.target.value)} className="min-h-32" />
      <Btn v="acid" onClick={pick} disabled={picking} className="w-full !py-3.5">{picking ? "Deciding…" : "Decide for me"}</Btn>
      <Panel className="text-center !py-12">
        <div ref={ref} className={cx("text-3xl sm:text-4xl font-bold tracking-tight transition-colors", picking ? "text-fog" : "text-acid")}>
          {result || "the oracle awaits"}
        </div>
      </Panel>
    </div>
  );
}

export const miscTools: ToolDef[] = [
  { id: "text-to-speech", name: "Text to Speech", desc: "Read any text aloud with voice, speed and pitch controls.", category: "everyday", icon: Volume2, keywords: ["tts", "read aloud", "speech", "voice reader"], featured: true, Component: TTS },
  { id: "screen-info", name: "Screen & Device Info", desc: "Viewport, resolution, pixel ratio, browser and OS — live.", category: "everyday", icon: Monitor, keywords: ["screen resolution", "what is my viewport", "device pixel ratio", "my browser"], Component: ScreenInfo },
  { id: "coin-flip", name: "Coin Flip", desc: "A satisfying 3D flip with running heads/tails statistics.", category: "everyday", icon: CircleDollarSign, keywords: ["heads or tails", "flip a coin", "toss"], Component: CoinFlip },
  { id: "dice-roller", name: "Dice Roller", desc: "d4 to d100, batches up to 6, with totals and history.", category: "everyday", icon: Dice5, keywords: ["roll dice", "d20", "dnd dice", "random dice"], Component: Dice },
  { id: "decision-maker", name: "Decision Maker", desc: "Can't pick? Type your options and let fate choose.", category: "everyday", icon: Lightbulb, keywords: ["random choice", "pick for me", "choose between", "wheel"], Component: Decision },
];
