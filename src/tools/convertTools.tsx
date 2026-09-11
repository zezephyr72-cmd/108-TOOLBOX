/* ── 16 Converters ─────────────────────────────────────────────── */
import { useEffect, useMemo, useState } from "react";
import { Thermometer, Ruler, Weight, Gauge, Clock, HardDrive, Hash, Crown, TextQuote, Radio, FileCode, Link, Code, Table, Compass, Timer, ArrowLeftRight, Play } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, Err, In, L, Num, Out, Panel, Row, Seg, Sel, TA, fmt } from "../lib/ui";

/* generic unit converter */
function UnitConv({ units, from: f0, to: t0, val: v0, note }: { units: [string, number][]; from: number; to: number; val: string; note?: string }) {
  const [val, setVal] = useState(v0);
  const [from, setFrom] = useState(f0);
  const [to, setTo] = useState(t0);
  const v = parseFloat(val) || 0;
  const base = v * units[from][1];
  const res = base / units[to][1];
  const nice = (n: number) => (n !== 0 && (Math.abs(n) >= 1e15 || Math.abs(n) < 0.000001) ? n.toExponential(4) : fmt(n, 6));
  return (
    <div className="space-y-5">
      <div>
        <L>Value</L>
        <Num value={val} onChange={(e) => setVal(e.target.value)} className="!text-2xl !py-4 font-bold" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div><L>From</L><Sel value={from} onChange={(e) => setFrom(+e.target.value)}>{units.map((u, i) => <option key={u[0]} value={i}>{u[0]}</option>)}</Sel></div>
        <Btn v="soft" onClick={() => { setFrom(to); setTo(from); }} className="mb-[2px] !px-3.5"><ArrowLeftRight size={15} /></Btn>
        <div><L>To</L><Sel value={to} onChange={(e) => setTo(+e.target.value)}>{units.map((u, i) => <option key={u[0]} value={i}>{u[0]}</option>)}</Sel></div>
      </div>
      <Panel className="text-center !py-8">
        <div className="font-mono2 text-[13px] text-fog">{fmt(v, 6) || 0} {units[from][0]} =</div>
        <div className="mt-1 text-4xl sm:text-5xl font-bold font-mono2 tabular-nums text-acid break-all">{nice(res)}</div>
        <div className="mt-1 font-mono2 text-[13px] text-fog">{units[to][0]}</div>
      </Panel>
      <Panel>
        {units.map((u) => <Row key={u[0]} k={u[0]} v={nice(base / u[1])} />)}
        {note && <p className="pt-2 text-[11px] text-fog/60 font-mono2">{note}</p>}
      </Panel>
    </div>
  );
}

/* temperature (non-linear) */
function Temperature() {
  const [src, setSrc] = useState<{ v: string; u: "c" | "f" | "k" }>({ v: "21", u: "c" });
  const n = parseFloat(src.v) || 0;
  const c = src.u === "c" ? n : src.u === "f" ? (n - 32) * 5 / 9 : n - 273.15;
  const f = c * 9 / 5 + 32, k = c + 273.15;
  const F = ({ u, label, val }: { u: "c" | "f" | "k"; label: string; val: number }) => (
    <div>
      <L>{label}</L>
      <Num value={src.u === u ? src.v : Number.isFinite(val) ? String(Math.round(val * 100) / 100) : ""} onChange={(e) => setSrc({ v: e.target.value, u })} className="!text-xl !py-4 font-bold text-center" />
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <F u="c" label="°Celsius" val={c} /><F u="f" label="°Fahrenheit" val={f} /><F u="k" label="Kelvin" val={k} />
      </div>
      <Panel>
        <Row k="Water freezes" v="0 °C = 32 °F = 273.15 K" /><Row k="Water boils" v="100 °C = 212 °F = 373.15 K" />
        <Row k="Absolute zero" v="-273.15 °C = -459.67 °F = 0 K" />
        <Row k="Nice fact" v="-40 °C = -40 °F (they meet!)" mono={false} />
      </Panel>
    </div>
  );
}

/* number base */
function NumberBase() {
  const [src, setSrc] = useState<{ v: string; b: number }>({ v: "255", b: 10 });
  const clean = src.v.trim();
  const valid = clean.length > 0 && [...clean.toLowerCase()].every((ch) => "0123456789abcdef".indexOf(ch) !== -1 && parseInt(ch, 16) < src.b);
  const dec = valid ? parseInt(clean, src.b) : NaN;
  const F = ({ label, b }: { label: string; b: number }) => (
    <div>
      <L>{label}</L>
      <In value={src.b === b ? src.v : valid ? dec.toString(b) : ""} onChange={(e) => setSrc({ v: e.target.value.replace(/\s/g, ""), b })} className={`font-mono2 ${!valid && src.b === b ? "!border-red-400/60" : ""}`} />
    </div>
  );
  return (
    <div className="space-y-4">
      <F label="Decimal (base 10)" b={10} /><F label="Binary (base 2)" b={2} />
      <F label="Octal (base 8)" b={8} /><F label="Hexadecimal (base 16)" b={16} />
      {!valid && <p className="text-[12px] font-mono2 text-red-400">“{clean}” isn't valid for base {src.b}</p>}
    </div>
  );
}

/* roman numerals */
const RN: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
function toRoman(n: number): string {
  let s = "";
  for (const [v, r] of RN) while (n >= v) { s += r; n -= v; }
  return s;
}
function Roman() {
  const [num, setNum] = useState("2026");
  const [rom, setRom] = useState("MMXXVI");
  const n = parseInt(num);
  const numValid = !isNaN(n) && n >= 1 && n <= 3999;
  const romUp = rom.toUpperCase().trim();
  const romValid = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(romUp) && romUp !== "";
  let romVal = 0;
  if (romValid) { let i = 0; for (const [v, r] of RN) while (romUp.startsWith(r, i)) { romVal += v; i += r.length; } }
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <L>Number (1–3999)</L>
          <Num value={num} onChange={(e) => { setNum(e.target.value); const v = parseInt(e.target.value); if (v >= 1 && v <= 3999) setRom(toRoman(v)); }} />
        </div>
        <div>
          <L>Roman numeral</L>
          <In value={rom} onChange={(e) => { setRom(e.target.value.toUpperCase()); const u = e.target.value.toUpperCase().trim(); if (/^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(u) && u) { let val = 0, i = 0; for (const [v, r] of RN) while (u.startsWith(r, i)) { val += v; i += r.length; } setNum(String(val)); } }} className="font-mono2 !text-xl tracking-[0.2em]" />
        </div>
      </div>
      {(numValid || romValid) && (
        <Panel className="text-center !py-8">
          <div className="font-serifit text-6xl text-acid tracking-wide">{numValid ? toRoman(n) : romUp}</div>
          <div className="mt-2 font-mono2 text-[13px] text-fog">= {fmt(romValid ? romVal : n, 0)}</div>
        </Panel>
      )}
      <div className="flex flex-wrap gap-2">
        {[4, 42, 99, 444, 888, 1994, 2026, 3999].map((x) => <Btn key={x} v="soft" className="font-mono2 !text-[12px]" onClick={() => { setNum(String(x)); setRom(toRoman(x)); }}>{x} = {toRoman(x)}</Btn>)}
      </div>
    </div>
  );
}

/* number to words */
const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function three(n: number): string {
  const h = Math.floor(n / 100), r = n % 100;
  let s = h ? ONES[h] + " hundred" + (r ? " " : "") : "";
  if (r > 0 && r < 20) s += ONES[r];
  else if (r >= 20) s += TENS[Math.floor(r / 10)] + (r % 10 ? "-" + ONES[r % 10] : "");
  return s;
}
export function toWords(n: number): string {
  if (!isFinite(n)) return "out of range";
  if (n < 0) return "minus " + toWords(-n);
  n = Math.floor(n);
  if (n === 0) return "zero";
  const SCALES: [number, string][] = [[1e15, "quadrillion"], [1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]];
  let s = "";
  for (const [v, name] of SCALES) {
    const q = Math.floor(n / v);
    if (q) { s += toWords(q) + " " + name + (n - q * v > 0 ? " " : ""); n -= q * v; }
  }
  if (n > 0) s += (s && n < 100 ? "and " : "") + three(n);
  return s;
}
function NumberWords() {
  const [v, setV] = useState("1234567");
  const n = parseFloat(v);
  const w = !isNaN(n) && Math.abs(n) < 1e18 ? toWords(n) : "";
  return (
    <div className="space-y-4">
      <L>Number</L>
      <Num value={v} onChange={(e) => setV(e.target.value)} className="!text-2xl !py-4 font-bold" />
      <Out value={w} mono={false} rows={3} />
      <div className="flex flex-wrap gap-2">
        {["42", "100", "1001", "1000000", "9876543210"].map((x) => <Btn key={x} v="soft" className="font-mono2 !text-[12px]" onClick={() => setV(x)}>{fmt(+x, 0)}</Btn>)}
      </div>
    </div>
  );
}

/* morse */
const MORSE: Record<string, string> = { a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "'": ".----.", '"': ".-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "/": "-..-.", "@": ".--.-." };
const MORSE_R: Record<string, string> = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
function MorseTool() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [t, setT] = useState("sos");
  const { out, err } = useMemo(() => {
    if (!t.trim()) return { out: "", err: "" };
    if (mode === "enc") {
      const bad = [...t].filter((c) => c !== " " && !MORSE[c.toLowerCase()]);
      if (bad.length) return { out: "", err: `Unsupported character: “${bad[0]}”` };
      return { out: t.trim().split(/\s+/).map((w) => [...w].map((c) => MORSE[c.toLowerCase()]).join(" ")).join("  /  "), err: "" };
    }
    const words = t.trim().split(/\s*\/\s*/);
    try {
      return {
        out: words.map((w) => w.trim().split(/\s+/).map((code) => {
          if (!MORSE_R[code]) throw new Error(`Unknown morse code “${code}”`);
          return MORSE_R[code];
        }).join("")).join(" "),
        err: "",
      };
    } catch (e) { return { out: "", err: (e as Error).message }; }
  }, [t, mode]);
  const play = () => {
    const code = mode === "enc" ? out : t;
    if (!code) return;
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const unit = 0.075;
    let start = ctx.currentTime + 0.06;
    const beep = (at: number, dur: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 640;
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.25, at + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(at); o.stop(at + dur + 0.05);
    };
    for (const ch of code) {
      if (ch === ".") { beep(start, unit); start += unit * 2; }
      else if (ch === "-") { beep(start, unit * 3); start += unit * 4; }
      else if (ch === "/") start += unit * 4;
      else if (ch === " ") start += unit * 1.4;
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Seg options={[{ v: "enc", label: "Text → Morse" }, { v: "dec", label: "Morse → Text" }]} value={mode} onChange={setMode} />
        <Btn v="acid" onClick={play} disabled={!(mode === "enc" ? out : t)}><Play size={14} /> Play beeps</Btn>
      </div>
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder={mode === "enc" ? "hello world" : ".... . .-.. .-.. ---"} />
      {err && <p className="text-[12px] font-mono2 text-red-400">{err}</p>}
      <Out value={out} />
      <Panel><Row k="SOS" v="... --- ..." /><Row k="Letter gap" v="single space" mono={false} /><Row k="Word gap" v="/" /></Panel>
    </div>
  );
}

/* base64 */
function Base64Tool() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [t, setT] = useState("");
  const { out, err } = useMemo(() => {
    if (!t) return { out: "", err: "" };
    try {
      if (mode === "enc") return { out: btoa(String.fromCharCode(...new TextEncoder().encode(t))), err: "" };
      return { out: new TextDecoder().decode(Uint8Array.from(atob(t.trim()), (c) => c.charCodeAt(0))), err: "" };
    } catch { return { out: "", err: mode === "enc" ? "Text too large to encode." : "Invalid Base64 input." }; }
  }, [t, mode]);
  return (
    <div className="space-y-4">
      <Seg options={[{ v: "enc", label: "Encode" }, { v: "dec", label: "Decode" }]} value={mode} onChange={setMode} />
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder={mode === "enc" ? "Hello, World! 🎉" : "SGVsbG8sIFdvcmxkIQ=="} />
      {err && <p className="text-[12px] font-mono2 text-red-400">{err}</p>}
      <Out value={out} />
    </div>
  );
}

/* url encode */
function UrlEnc() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [full, setFull] = useState(true);
  const [t, setT] = useState("");
  const { out, err } = useMemo(() => {
    if (!t) return { out: "", err: "" };
    try {
      if (mode === "enc") return { out: full ? encodeURIComponent(t) : encodeURI(t), err: "" };
      return { out: decodeURIComponent(t), err: "" };
    } catch { return { out: "", err: "Malformed URI sequence." }; }
  }, [t, mode, full]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
        <Seg options={[{ v: "enc", label: "Encode" }, { v: "dec", label: "Decode" }]} value={mode} onChange={setMode} />
        {mode === "enc" && (
          <label className="flex items-center gap-2 text-[13px] text-fog cursor-pointer">
            <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} className="accent-[#cdff3d] w-4 h-4" />
            encode all reserved chars
          </label>
        )}
      </div>
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder={mode === "enc" ? "https://example.com/search?q=café au lait&lang=fr" : "https%3A%2F%2Fexample.com"} />
      {err && <p className="text-[12px] font-mono2 text-red-400">{err}</p>}
      <Out value={out} />
    </div>
  );
}

/* hex ↔ text */
function HexText() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [t, setT] = useState("");
  const { out, err } = useMemo(() => {
    if (!t.trim()) return { out: "", err: "" };
    try {
      if (mode === "enc") return { out: [...t].map((c) => (c.codePointAt(0) || 0).toString(16).padStart(2, "0")).join(" "), err: "" };
      const parts = t.trim().replace(/^0x/i, "").split(/[\s,]+/);
      if (!parts.every((p) => /^[0-9a-fA-F]{1,6}$/.test(p))) return { out: "", err: "Hex must be pairs like 48 65 6c 6c 6f" };
      return { out: parts.map((p) => String.fromCodePoint(parseInt(p, 16))).join(""), err: "" };
    } catch { return { out: "", err: "Invalid hex value." }; }
  }, [t, mode]);
  return (
    <div className="space-y-4">
      <Seg options={[{ v: "enc", label: "Text → Hex" }, { v: "dec", label: "Hex → Text" }]} value={mode} onChange={setMode} />
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder={mode === "enc" ? "Hello" : "48 65 6c 6c 6f"} />
      {err && <p className="text-[12px] font-mono2 text-red-400">{err}</p>}
      <Out value={out} />
    </div>
  );
}

/* csv ↔ json */
function parseCSV(s: string): string[][] {
  const rows: string[][] = []; let cur = [""]; let inQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') { if (s[i + 1] === '"') { cur[cur.length - 1] += '"'; i++; } else inQ = false; }
      else cur[cur.length - 1] += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") cur.push("");
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; rows.push(cur); cur = [""]; }
    else cur[cur.length - 1] += c;
  }
  if (cur.length > 1 || cur[0] !== "") rows.push(cur);
  return rows;
}
function CsvJson() {
  const [mode, setMode] = useState<"c2j" | "j2c">("c2j");
  const [t, setT] = useState('name,age,city\nAda,36,London\n"Turing, Alan",41,"Manchester, UK"');
  const { out, err } = useMemo(() => {
    if (!t.trim()) return { out: "", err: "" };
    try {
      if (mode === "c2j") {
        const rows = parseCSV(t);
        if (rows.length < 1) throw new Error("Empty CSV");
        const head = rows[0];
        const objs = rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
        return { out: JSON.stringify(objs, null, 2), err: "" };
      }
      const data = JSON.parse(t);
      if (!Array.isArray(data)) throw new Error("JSON must be an array of objects");
      const keys = [...new Set(data.flatMap((o) => Object.keys(typeof o === "object" && o ? o : { v: 0 })))];
      const esc = (v: unknown) => { const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      return { out: [keys.join(","), ...data.map((o) => keys.map((k) => esc((o as Record<string, unknown>)[k])).join(","))].join("\n"), err: "" };
    } catch (e) { return { out: "", err: (e as Error).message }; }
  }, [t, mode]);
  return (
    <div className="space-y-4">
      <Seg options={[{ v: "c2j", label: "CSV → JSON" }, { v: "j2c", label: "JSON → CSV" }]} value={mode} onChange={setMode} />
      <TA value={t} onChange={(e) => setT(e.target.value)} />
      {err && <p className="text-[12px] font-mono2 text-red-400">{err}</p>}
      <Out value={out} rows={8} />
    </div>
  );
}

/* unix timestamp */
function UnixTime() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [inp, setInp] = useState(String(Math.floor(Date.now() / 1000)));
  useEffect(() => { const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(id); }, []);
  const n = parseFloat(inp);
  const ms = !isNaN(n) ? (Math.abs(n) > 1e11 ? n : n * 1000) : NaN;
  const d = !isNaN(ms) ? new Date(ms) : null;
  return (
    <div className="space-y-5">
      <Panel className="text-center !py-7">
        <div className="text-[11px] font-mono2 uppercase tracking-[0.2em] text-fog flex items-center justify-center gap-2">
          <span className="relative w-2 h-2 rounded-full bg-acid ping-dot" /> Unix time right now
        </div>
        <div className="mt-1 text-5xl font-bold font-mono2 tabular-nums text-acid">{now}</div>
      </Panel>
      <L hint="seconds or milliseconds">Convert a timestamp</L>
      <Num value={inp} onChange={(e) => setInp(e.target.value)} />
      {d && !isNaN(d.getTime()) ? (
        <Panel>
          <Row k="Local" v={d.toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" })} />
          <Row k="UTC" v={d.toUTCString()} />
          <Row k="ISO 8601" v={d.toISOString()} />
          <Row k="Milliseconds" v={fmt(d.getTime(), 0)} />
        </Panel>
      ) : inp ? <Err msg="Not a valid timestamp" /> : null}
    </div>
  );
}

export const convertTools: ToolDef[] = [
  { id: "temperature-converter", name: "Temperature Converter", desc: "Celsius, Fahrenheit and Kelvin — all three stay in sync.", category: "convert", icon: Thermometer, keywords: ["celsius fahrenheit", "kelvin", "degrees"], Component: Temperature },
  { id: "length-converter", name: "Length Converter", desc: "Meters, feet, inches, miles, kilometers and more at once.", category: "convert", icon: Ruler, keywords: ["distance", "cm to inch", "feet meters", "miles km"], Component: () => <UnitConv units={[["Millimeters", 0.001], ["Centimeters", 0.01], ["Meters", 1], ["Kilometers", 1000], ["Inches", 0.0254], ["Feet", 0.3048], ["Yards", 0.9144], ["Miles", 1609.344]]} from={2} to={4} val="100" /> },
  { id: "weight-converter", name: "Weight Converter", desc: "Grams, kilograms, pounds, ounces, stone and tonnes.", category: "convert", icon: Weight, keywords: ["kg to lbs", "pounds", "ounces", "mass"], Component: () => <UnitConv units={[["Milligrams", 0.001], ["Grams", 1], ["Kilograms", 1000], ["Tonnes", 1e6], ["Ounces", 28.3495], ["Pounds", 453.592], ["Stone", 6350.29]]} from={2} to={5} val="70" /> },
  { id: "speed-converter", name: "Speed Converter", desc: "km/h, mph, knots, m/s and ft/s — for road, sea and sky.", category: "convert", icon: Gauge, keywords: ["kmh mph", "knots", "velocity"], Component: () => <UnitConv units={[["m/s", 1], ["km/h", 0.277778], ["mph", 0.44704], ["Knots", 0.514444], ["ft/s", 0.3048]]} from={1} to={2} val="100" /> },
  { id: "time-converter", name: "Time Unit Converter", desc: "Milliseconds to years and everything in between.", category: "convert", icon: Clock, keywords: ["seconds minutes", "hours days", "weeks months"], Component: () => <UnitConv units={[["Milliseconds", 0.001], ["Seconds", 1], ["Minutes", 60], ["Hours", 3600], ["Days", 86400], ["Weeks", 604800], ["Months (30.44d)", 2629800], ["Years (365.25d)", 31557600]]} from={2} to={3} val="90" /> },
  { id: "data-size-converter", name: "Data Size Converter", desc: "Bytes to petabytes, binary (1024) style — see every unit at once.", category: "convert", icon: HardDrive, keywords: ["mb gb", "bytes", "kilobytes", "storage"], Component: () => <UnitConv units={[["Bytes", 1], ["Kilobytes", 1024], ["Megabytes", 1048576], ["Gigabytes", 1073741824], ["Terabytes", 1099511627776], ["Petabytes", 1125899906842624]]} from={2} to={3} val="512" note="1 KB = 1024 bytes (binary / IEC convention)" /> },
  { id: "number-base", name: "Number Base Converter", desc: "Decimal, binary, octal and hex — type in any field.", category: "convert", icon: Hash, keywords: ["binary decimal", "hexadecimal", "octal", "base 16"], Component: NumberBase },
  { id: "roman-numerals", name: "Roman Numeral Converter", desc: "2026 → MMXXVI and back, from 1 to 3999.", category: "convert", icon: Crown, keywords: ["roman numbers", "iv xc", "numerals"], Component: Roman },
  { id: "number-to-words", name: "Number to Words", desc: "Spell any number out in English — up to quadrillions.", category: "convert", icon: TextQuote, keywords: ["spell number", "amount in words", "check writing"], Component: NumberWords },
  { id: "morse-code", name: "Morse Code Translator", desc: "Text ↔ morse with real audio beeps you can play.", category: "convert", icon: Radio, keywords: ["sos", "dots dashes", "telegraph"], featured: true, Component: MorseTool },
  { id: "base64", name: "Base64 Encode / Decode", desc: "Unicode-safe Base64 conversion, right in your browser.", category: "convert", icon: FileCode, keywords: ["btoa", "atob", "encode64"], Component: Base64Tool },
  { id: "url-encoder", name: "URL Encoder / Decoder", desc: "Escape special characters for URLs or decode percent-encoding.", category: "convert", icon: Link, keywords: ["percent encoding", "encodeuri", "query string"], Component: UrlEnc },
  { id: "hex-to-text", name: "Hex ↔ Text", desc: "Convert characters to hex codes and decode them back.", category: "convert", icon: Code, keywords: ["hexadecimal string", "0x", "hex decode"], Component: HexText },
  { id: "csv-json", name: "CSV ↔ JSON Converter", desc: "Two-way conversion with proper quote and comma handling.", category: "convert", icon: Table, keywords: ["csv to json", "json to csv", "spreadsheet data"], Component: CsvJson },
  { id: "angle-converter", name: "Angle Converter", desc: "Degrees, radians, gradians, turns and arcminutes.", category: "convert", icon: Compass, keywords: ["degrees radians", "grads", "pi"], Component: () => <UnitConv units={[["Degrees", 1], ["Radians", 57.2958], ["Gradians", 0.9], ["Turns", 360], ["Arcminutes", 1 / 60], ["Arcseconds", 1 / 3600]]} from={0} to={1} val="180" /> },
  { id: "unix-timestamp", name: "Unix Timestamp Converter", desc: "Epoch seconds ↔ human dates, with a live ticking clock.", category: "convert", icon: Timer, keywords: ["epoch", "timestamp to date", "unix time"], Component: UnixTime },
];
