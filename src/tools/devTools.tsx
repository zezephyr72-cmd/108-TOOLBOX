/* ── 12 Developer tools ────────────────────────────────────────── */
import { useEffect, useMemo, useState } from "react";
import { Braces, Regex, BookOpen, ShieldCheck, Brackets, Paintbrush, Minimize2, Network, CalendarClock, Lock, Keyboard, Sigma } from "lucide-react";
import { marked } from "marked";
import type { ToolDef } from "../lib/types";
import { Btn, CopyBtn, Err, In, L, Out, Panel, Row, Seg, Stat, TA, Toggle, fmt } from "../lib/ui";

/* 1 ─ JSON formatter */
function JsonTool() {
  const [t, setT] = useState('{"name":"toolbox","tools":81,"free":true,"tags":["fast","offline"]}');
  const [sortKeys, setSortKeys] = useState(false);
  const [indent, setIndent] = useState<"2" | "4" | "tab">("2");
  const [out, setOut] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const sortDeep = (v: unknown): unknown => Array.isArray(v) ? v.map(sortDeep) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v as object).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, sortDeep(x)])) : v;
  const run = (mode: "fmt" | "min") => {
    try {
      const parsed = JSON.parse(t);
      setOut(mode === "fmt" ? JSON.stringify(sortKeys ? sortDeep(parsed) : parsed, null, indent === "tab" ? "\t" : +indent) : JSON.stringify(parsed));
      setErr(null);
    } catch (e) { setErr((e as Error).message); setOut(""); }
  };
  const stats = useMemo(() => {
    try {
      const p = JSON.parse(t);
      let keys = 0;
      const walk = (v: unknown) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") { keys += Object.keys(v).length; Object.values(v).forEach(walk); } };
      walk(p);
      return { keys, bytes: new Blob([t]).size, depth: JSON.stringify(p).split("").reduce((m, c) => (c === "{" || c === "[" ? m + 1 : m), 0) };
    } catch { return null; }
  }, [t]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Btn v="acid" onClick={() => run("fmt")}>Format</Btn>
        <Btn v="soft" onClick={() => run("min")}>Minify</Btn>
        <Seg options={[{ v: "2" as const, label: "2 spaces" }, { v: "4" as const, label: "4 spaces" }, { v: "tab" as const, label: "Tab" }]} value={indent} onChange={setIndent} />
        <Toggle on={sortKeys} onChange={setSortKeys} label="Sort keys" />
      </div>
      <TA value={t} onChange={(e) => setT(e.target.value)} className="min-h-40" placeholder='{"paste":"json here"}' />
      <Err msg={err} />
      {stats && <div className="grid grid-cols-3 gap-3"><Stat label="Total keys" value={fmt(stats.keys, 0)} /><Stat label="Size" value={`${stats.bytes} B`} /><Stat label="Valid JSON" value={<span className="text-acid">yes ✓</span>} /></div>}
      {out && <Out value={out} rows={8} />}
    </div>
  );
}

/* 2 ─ Regex tester */
function RegexTool() {
  const [pat, setPat] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState({ g: true, i: true, m: false, s: false });
  const [t, setT] = useState("Contact ada@lovelace.dev or alan.turing@enigma.uk — not @invalid or broken@ either.");
  const { matches, parts, err } = useMemo(() => {
    if (!pat) return { matches: [], parts: [{ hl: false, s: t }], err: "" };
    try {
      const fl = (flags.g ? "g" : "") + (flags.i ? "i" : "") + (flags.m ? "m" : "") + (flags.s ? "s" : "");
      const re = new RegExp(pat, fl);
      const ms: { m: string; i: number; g: string[] }[] = [];
      const parts: { hl: boolean; s: string }[] = [];
      let last = 0, mm: RegExpExecArray | null;
      let guard = 0;
      while ((mm = re.exec(t)) && guard++ < 500) {
        if (mm.index > last) parts.push({ hl: false, s: t.slice(last, mm.index) });
        parts.push({ hl: true, s: mm[0] });
        ms.push({ m: mm[0], i: mm.index, g: mm.slice(1) });
        last = mm.index + mm[0].length;
        if (mm[0].length === 0) { re.lastIndex++; }
        if (!flags.g) break;
      }
      if (last < t.length) parts.push({ hl: false, s: t.slice(last) });
      return { matches: ms, parts, err: "" };
    } catch (e) { return { matches: [], parts: [{ hl: false, s: t }], err: (e as Error).message }; }
  }, [pat, flags, t]);
  return (
    <div className="space-y-4">
      <div>
        <L>Pattern</L>
        <div className="flex items-center bg-panel2 border border-line rounded-xl overflow-hidden focus-within:border-acid/60">
          <span className="pl-4 font-mono2 text-acid">/</span>
          <input value={pat} onChange={(e) => setPat(e.target.value)} className="flex-1 bg-transparent px-2 py-3 font-mono2 text-sm outline-none text-cream" spellCheck={false} />
          <span className="pr-4 font-mono2 text-acid">/{Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join("")}</span>
        </div>
        <div className="mt-2 flex gap-4">
          {([["g", "global"], ["i", "ignore case"], ["m", "multiline"], ["s", "dotAll"]] as const).map(([f, lbl]) => (
            <label key={f} className="flex items-center gap-2 text-[12.5px] text-fog cursor-pointer">
              <input type="checkbox" checked={flags[f]} onChange={(e) => setFlags({ ...flags, [f]: e.target.checked })} className="accent-[#cdff3d] w-3.5 h-3.5" />
              <span className="font-mono2 text-cream">{f}</span> {lbl}
            </label>
          ))}
        </div>
      </div>
      <div><L>Test string</L><TA value={t} onChange={(e) => setT(e.target.value)} /></div>
      <Err msg={err} />
      <div className="bg-ink/70 border border-line rounded-xl px-4 py-3.5 font-mono2 text-[13px] leading-relaxed whitespace-pre-wrap break-words">
        {parts.map((p, i) => p.hl ? <mark key={i} className="bg-acid text-ink rounded px-0.5">{p.s}</mark> : <span key={i} className="text-fog">{p.s}</span>)}
      </div>
      <p className="text-[12px] font-mono2 text-fog"><span className="text-acid">{matches.length}</span> match{matches.length === 1 ? "" : "es"}</p>
      {matches.length > 0 && (
        <div className="max-h-52 overflow-y-auto border border-line rounded-xl divide-y divide-line">
          {matches.map((m, i) => (
            <div key={i} className="px-4 py-2.5 font-mono2 text-[12px] flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-fog w-10">#{i + 1}</span><span className="text-acid">{m.m}</span>
              <span className="text-fog">@ {m.i}</span>
              {m.g.length > 0 && <span className="text-fog">groups: <span className="text-cream">{JSON.stringify(m.g)}</span></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* 3 ─ Markdown preview */
function Markdown() {
  const [t, setT] = useState("# Hello, markdown\n\n**Bold**, *italic*, `code`, [links](https://example.com)\n\n- lists work\n- second item\n\n> blockquotes too\n\n```js\nconst x = 42;\n```");
  const html = useMemo(() => marked.parse(t, { async: false }) as string, [t]);
  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <div><L>Markdown</L><TA value={t} onChange={(e) => setT(e.target.value)} className="min-h-[420px]" /></div>
      <div>
        <L hint={`${t.length} chars`}>Preview</L>
        <div className="md-body bg-ink/60 border border-line rounded-xl p-5 min-h-[420px] overflow-auto" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

/* 4 ─ JWT decoder */
function b64url(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return new TextDecoder().decode(Uint8Array.from(atob(s), (c) => c.charCodeAt(0)));
}
function Jwt() {
  const [t, setT] = useState("");
  const r = useMemo(() => {
    const parts = t.trim().split(".");
    if (parts.length !== 3) return null;
    try {
      const header = JSON.parse(b64url(parts[0]));
      const payload = JSON.parse(b64url(parts[1]));
      const now = Date.now() / 1000;
      const expired = typeof payload.exp === "number" ? payload.exp < now : null;
      return { header, payload, expired, sig: parts[2] };
    } catch { return { bad: true }; }
  }, [t]);
  const sample = () => {
    const h = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "");
    const p = btoa(JSON.stringify({ sub: "user_42", name: "Ada Lovelace", iat: Math.floor(Date.now() / 1000) - 3600, exp: Math.floor(Date.now() / 1000) + 3600 })).replace(/=/g, "");
    setT(`${h}.${p}.fakesignature`);
  };
  const fmtT = (ts: unknown) => typeof ts === "number" ? new Date(ts * 1000).toLocaleString() : null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <L>Paste a JWT</L>
        <Btn v="soft" className="!text-[11px] !py-1" onClick={sample}>Load sample</Btn>
      </div>
      <TA value={t} onChange={(e) => setT(e.target.value)} className="min-h-28" placeholder="eyJhbGciOi…" />
      {t && !r && <Err msg="A JWT has exactly 3 dot-separated parts." />}
      {r?.bad && <Err msg="Couldn't decode — malformed Base64URL or JSON." />}
      {r && !r.bad && (
        <>
          {r.expired !== null && (
            <div className={`text-[12.5px] font-mono2 rounded-lg px-3.5 py-2.5 border ${r.expired ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-acid bg-acid/10 border-acid/20"}`}>
              {r.expired ? "✕ Token is EXPIRED" : "✓ Token is still valid"} (based on exp claim)
            </div>
          )}
          <div className="grid lg:grid-cols-2 gap-4">
            <div><L>Header</L><Out value={JSON.stringify(r.header, null, 2)} rows={4} /></div>
            <div><L>Payload</L><Out value={JSON.stringify(r.payload, null, 2)} rows={4} /></div>
          </div>
          <Panel>
            {["iat", "exp", "nbf"].map((k) => fmtT((r.payload as Record<string, unknown>)[k]) && (
              <Row key={k} k={k} v={`${fmtT((r.payload as Record<string, unknown>)[k])}`} />
            ))}
            <Row k="Signature" v={`${r.sig!.slice(0, 24)}… (not verified — that needs the secret)`} />
          </Panel>
        </>
      )}
    </div>
  );
}

/* 5 ─ HTML entities */
const NAMED: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "©": "&copy;", "®": "&reg;", "™": "&trade;", "€": "&euro;", "£": "&pound;", "¥": "&yen;", "¢": "&cent;", "°": "&deg;", "±": "&plusmn;", "×": "&times;", "÷": "&divide;", "–": "&ndash;", "—": "&mdash;", "…": "&hellip;", " ": "&nbsp;" };
function Entities() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [all, setAll] = useState(false);
  const [t, setT] = useState('<div class="hero">Café — 100% café ☕</div>');
  const out = useMemo(() => {
    if (!t) return "";
    if (mode === "dec") {
      const doc = new DOMParser().parseFromString(t, "text/html");
      return doc.documentElement.textContent || "";
    }
    return [...t].map((c) => NAMED[c] && c !== " " ? NAMED[c] : all && c.codePointAt(0)! > 127 ? `&#x${c.codePointAt(0)!.toString(16).toUpperCase()};` : ["&", "<", ">", '"', "'"].includes(c) ? NAMED[c] : c).join("");
  }, [t, mode, all]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Seg options={[{ v: "enc", label: "Encode" }, { v: "dec", label: "Decode" }]} value={mode} onChange={setMode} />
        {mode === "enc" && <Toggle on={all} onChange={setAll} label="Encode non-ASCII too" />}
      </div>
      <TA value={t} onChange={(e) => setT(e.target.value)} />
      <Out value={out} />
    </div>
  );
}

/* 6 ─ CSS minifier / beautifier */
function CssTool() {
  const [t, setT] = useState("/* hero styles */\n.hero {\n  display: flex;\n  align-items: center;\n  color: #cdff3d;\n}\n\n.hero > h1 {\n  font-weight: 700;\n}");
  const [mode, setMode] = useState<"min" | "beauty">("min");
  const { out, saved } = useMemo(() => {
    let s = t;
    if (mode === "min") {
      s = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>+~])\s*/g, "$1").replace(/;}/g, "}").trim();
    } else {
      s = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").replace(/\s*([{}:;,>+~])\s*/g, "$1").trim()
        .replace(/;/g, ";\n  ").replace(/\{/g, " {\n  ").replace(/\}/g, "\n}\n\n").replace(/\n\s*\n/g, "\n").replace(/,\s*/g, ", ").trim();
    }
    return { out: s, saved: t.length - s.length };
  }, [t, mode]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Seg options={[{ v: "min", label: "Minify" }, { v: "beauty", label: "Beautify" }]} value={mode} onChange={setMode} />
        {t && <span className="text-[12px] font-mono2 text-acid">{saved >= 0 ? `−${saved}` : `+${-saved}`} bytes ({t.length ? Math.round((saved / t.length) * 100) : 0}%)</span>}
      </div>
      <TA value={t} onChange={(e) => setT(e.target.value)} className="min-h-40" />
      <Out value={out} rows={8} />
    </div>
  );
}

/* 7 ─ JS minifier (comment + whitespace strip, string-safe) */
function JsTool() {
  const [t, setT] = useState('// greet the world\nfunction greet(name) {\n  const msg = "Hello, " + name + "!"; // build message\n  console.log(msg);\n  return msg;\n}');
  const { out, err, saved } = useMemo(() => {
    try {
      let s = "", i = 0, str = "";
      const src = t;
      while (i < src.length) {
        const c = src[i], nx = src[i + 1];
        if (str) {
          s += c;
          if (c === "\\") { s += nx; i += 2; continue; }
          if (c === str) str = "";
          i++; continue;
        }
        if (c === '"' || c === "'" || c === "`") { str = c; s += c; i++; continue; }
        if (c === "/" && nx === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
        if (c === "/" && nx === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
        s += c; i++;
      }
      const lines = s.split("\n").map((l) => l.trim().replace(/[ \t]{2,}/g, " ")).filter((l) => l.length);
      const res = lines.join("\n");
      return { out: res, err: "", saved: t.length - res.length };
    } catch (e) { return { out: "", err: (e as Error).message, saved: 0 }; }
  }, [t]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-[12px] text-fog">Strips comments, extra spaces & blank lines (string-aware, keeps syntax intact)</span>
        {t && <span className="text-[12px] font-mono2 text-acid">−{saved} bytes ({t.length ? Math.round((saved / t.length) * 100) : 0}%)</span>}
      </div>
      <TA value={t} onChange={(e) => setT(e.target.value)} className="min-h-40" />
      <Err msg={err} />
      <Out value={out} rows={8} />
    </div>
  );
}

/* 8 ─ URL parser */
function UrlParser() {
  const [t, setT] = useState("https://user:pass@shop.example.com:8080/products/shoes?color=red&size=42&sale=true#reviews");
  const u = useMemo(() => { try { return new URL(t); } catch { return null; } }, [t]);
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} className="min-h-20" placeholder="https://…" />
      {!u && t && <Err msg="That doesn't parse as a valid URL (include the protocol, e.g. https://)" />}
      {u && (
        <>
          <Panel>
            <Row k="Protocol" v={u.protocol} /><Row k="Host" v={u.host} /><Row k="Hostname" v={u.hostname} />
            <Row k="Port" v={u.port || (u.protocol === "https:" ? "443 (default)" : u.protocol === "http:" ? "80 (default)" : "—")} />
            <Row k="Path" v={u.pathname} /><Row k="Hash" v={u.hash || "—"} />
            {u.username && <Row k="Username" v={u.username} />}
            {u.password && <Row k="Password" v="••••••" />}
          </Panel>
          {[...u.searchParams.entries()].length > 0 && (
            <div>
              <L hint={`${[...u.searchParams.entries()].length} params`}>Query parameters</L>
              <div className="border border-line rounded-xl overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead><tr className="bg-panel2 text-left font-mono2 text-[10.5px] uppercase tracking-widest text-fog"><th className="px-4 py-2.5 font-medium">Key</th><th className="px-4 py-2.5 font-medium">Value</th></tr></thead>
                  <tbody>{[...u.searchParams.entries()].map(([k, v], i) => (
                    <tr key={i} className="border-t border-line"><td className="px-4 py-2.5 font-mono2 text-acid">{k}</td><td className="px-4 py-2.5 font-mono2 text-cream break-all">{v}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* 9 ─ Cron parser */
function parseField(f0: string, lo: number, hi: number, names?: Record<string, number>): Set<number> {
  let f = f0.toLowerCase();
  if (names) for (const [k, v] of Object.entries(names)) f = f.replace(new RegExp(`\\b${k}\\b`, "g"), String(v));
  const out = new Set<number>();
  for (const part of f.split(",")) {
    const m = part.match(/^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/);
    if (!m) throw new Error(`invalid token "${part}"`);
    const step = m[2] ? +m[2] : 1;
    const [a, b] = m[1] === "*" ? [lo, hi] : m[1].includes("-") ? (m[1].split("-").map(Number) as [number, number]) : ([+m[1], m[2] ? hi : +m[1]] as [number, number]);
    if (a > b || a < lo || b > hi) throw new Error(`range ${a}-${b} out of bounds (${lo}–${hi})`);
    for (let i = a; i <= b; i += step) out.add(i);
  }
  return out;
}
const MON: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const DOW: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
function Cron() {
  const [expr, setExpr] = useState("30 9 * * mon-fri");
  const r = useMemo(() => {
    try {
      const f = expr.trim().split(/\s+/);
      if (f.length !== 5) throw new Error("Cron needs exactly 5 fields: min hour day month weekday");
      const mins = parseField(f[0], 0, 59);
      const hrs = parseField(f[1], 0, 23);
      const dom = parseField(f[2], 1, 31);
      const mon = parseField(f[3], 1, 12, MON);
      const dowRaw = parseField(f[4], 0, 7, DOW);
      const dow = new Set([...dowRaw].map((d) => (d === 7 ? 0 : d)));
      const domStar = f[2] === "*", dowStar = f[4] === "*";
      const next: Date[] = [];
      const d = new Date();
      d.setSeconds(0, 0);
      d.setMinutes(d.getMinutes() + 1);
      let guard = 0;
      while (next.length < 5 && guard++ < 527040) {
        const domOk = domStar || dom.has(d.getDate());
        const dowOk = dowStar || dow.has(d.getDay());
        const dayOk = domStar && dowStar ? true : domStar ? dowOk : dowStar ? domOk : domOk || dowOk;
        if (mon.has(d.getMonth() + 1) && dayOk && hrs.has(d.getHours()) && mins.has(d.getMinutes())) next.push(new Date(d));
        d.setMinutes(d.getMinutes() + 1);
      }
      const desc = [
        f[0] === "*" ? "every minute" : f[0].startsWith("*/") ? `every ${f[0].slice(2)} minutes` : `at minute ${f[0]}`,
        f[1] === "*" ? "of every hour" : f[1].startsWith("*/") ? `of every ${f[1].slice(2)} hours` : `past hour ${f[1]}`,
        domStar ? "" : `on day-of-month ${f[2]}`,
        f[3] === "*" ? "" : `in month ${f[3]}`,
        dowStar ? "" : `on ${f[4]}`,
      ].filter(Boolean).join(" ");
      return { desc, next, err: "" };
    } catch (e) { return { desc: "", next: [], err: (e as Error).message }; }
  }, [expr]);
  return (
    <div className="space-y-4">
      <L hint="min hour day-of-month month day-of-week">Cron expression</L>
      <In value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono2 !text-lg !py-4 text-center tracking-widest" />
      <div className="grid grid-cols-5 gap-1.5">
        {["minute", "hour", "day", "month", "weekday"].map((s, i) => (
          <div key={s} className="text-center">
            <div className="font-mono2 text-acid text-[13px]">{expr.trim().split(/\s+/)[i] || "·"}</div>
            <div className="text-[9.5px] font-mono2 uppercase tracking-widest text-fog mt-1">{s}</div>
          </div>
        ))}
      </div>
      <Err msg={r.err} />
      {r.desc && (
        <>
          <Panel className="text-center !py-6"><span className="text-[15px] text-cream">Runs <span className="text-acid font-semibold">{r.desc}</span></span></Panel>
          <div>
            <L>Next 5 runs</L>
            <Panel>{r.next.map((d, i) => <Row key={i} k={d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} v={d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} />)}</Panel>
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-2">
        {["* * * * *", "*/15 * * * *", "0 9 * * mon-fri", "0 0 1 * *", "30 3 * * sun", "*/10 9-17 * * *"].map((c) => <Btn key={c} v="soft" className="font-mono2 !text-[11.5px]" onClick={() => setExpr(c)}>{c}</Btn>)}
      </div>
    </div>
  );
}

/* 10 ─ chmod */
function Chmod() {
  const [bits, setBits] = useState<boolean[][]>([[true, true, false], [true, false, true], [true, false, true]]);
  const octal = bits.map((b) => (b[0] ? 4 : 0) + (b[1] ? 2 : 0) + (b[2] ? 1 : 0)).join("");
  const symbolic = bits.map((b) => `${b[0] ? "r" : "-"}${b[1] ? "w" : "-"}${b[2] ? "x" : "-"}`).join("");
  return (
    <div className="space-y-5">
      <Panel className="overflow-x-auto !p-0">
        <table className="w-full text-center">
          <thead><tr className="font-mono2 text-[10.5px] uppercase tracking-widest text-fog">
            <th className="p-3"></th><th className="p-3">Read (4)</th><th className="p-3">Write (2)</th><th className="p-3">Execute (1)</th>
          </tr></thead>
          <tbody>
            {["Owner", "Group", "Public"].map((who, i) => (
              <tr key={who} className="border-t border-line">
                <td className="p-3 text-left font-mono2 text-[12px] text-cream">{who}</td>
                {[0, 1, 2].map((j) => (
                  <td key={j} className="p-3">
                    <button onClick={() => setBits(bits.map((row, ri) => ri === i ? row.map((v, cj) => cj === j ? !v : v) : row))}
                      className={`w-12 h-12 rounded-xl font-mono2 text-lg font-bold transition-all cursor-pointer ${bits[i][j] ? "bg-acid text-ink" : "bg-panel2 text-fog border border-line hover:border-acid/40"}`}>
                      {"rwx"[j]}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <div className="grid sm:grid-cols-2 gap-3">
        <Panel className="text-center !py-6"><div className="font-mono2 text-4xl font-bold text-acid">{octal}</div><div className="mt-2 font-mono2 text-[12px] text-fog flex items-center justify-center gap-2">chmod {octal} file.txt <CopyBtn text={`chmod ${octal}`} id="ch" label="" /></div></Panel>
        <Panel className="text-center !py-6"><div className="font-mono2 text-4xl font-bold text-cream">{symbolic}</div><div className="mt-2 font-mono2 text-[12px] text-fog">symbolic notation</div></Panel>
      </div>
      <div className="flex flex-wrap gap-2">
        {([[6, 4, 4], [7, 5, 5], [6, 0, 0], [7, 0, 0], [4, 0, 0], [7, 7, 7]] as const).map((p) => (
          <Btn key={p.join("")} v="soft" className="font-mono2 !text-[12px]" onClick={() => setBits(p.map((d) => [(d & 4) > 0, (d & 2) > 0, (d & 1) > 0]))}>{p.join("")}</Btn>
        ))}
      </div>
    </div>
  );
}

/* 11 ─ Keyboard tester */
function KeyTester() {
  const [last, setLast] = useState<{ key: string; code: string; kc: number; mods: string } | null>(null);
  const [hist, setHist] = useState<string[]>([]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      e.preventDefault();
      const mods = [e.ctrlKey && "Ctrl", e.shiftKey && "Shift", e.altKey && "Alt", e.metaKey && "Meta"].filter(Boolean).join("+");
      setLast({ key: e.key === " " ? "Space" : e.key, code: e.code, kc: e.keyCode, mods });
      setHist((h2) => [e.key === " " ? "␣" : e.key, ...h2].slice(0, 24));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  return (
    <div className="space-y-5">
      <Panel className="text-center !py-14 relative overflow-hidden">
        <div className="text-[11px] font-mono2 uppercase tracking-[0.25em] text-fog">click anywhere, then press any key</div>
        <div className="mt-4 text-6xl sm:text-7xl font-bold font-mono2 text-acid min-h-[1.2em] break-all">{last ? (last.mods ? last.mods + "+" : "") + last.key : "·"}</div>
      </Panel>
      {last && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="event.key" value={last.key} /><Stat label="event.code" value={last.code} /><Stat label="keyCode" value={last.kc} />
        </div>
      )}
      {hist.length > 0 && (
        <div>
          <L>History</L>
          <div className="flex flex-wrap gap-1.5">{hist.map((k, i) => <span key={i} className="kbd key !text-[12px] !py-1.5 !px-2.5" style={{ opacity: 1 - i * 0.035 }}>{k}</span>)}</div>
        </div>
      )}
    </div>
  );
}

/* 12 ─ Unicode inspector */
function Unicode() {
  const [t, setT] = useState("A→✓🚀");
  const chars = [...t].slice(0, 48);
  const enc = new TextEncoder();
  return (
    <div className="space-y-4">
      <In value={t} onChange={(e) => setT(e.target.value)} placeholder="Type any characters…" className="!text-lg" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {chars.map((c, i) => {
          const cp = c.codePointAt(0)!;
          const bytes = [...enc.encode(c)].map((b) => b.toString(16).toUpperCase()).join(" ");
          return (
            <Panel key={i} className="!p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{c === " " ? "␣" : c}</span>
                <span className="font-mono2 text-acid text-[13px]">U+{cp.toString(16).toUpperCase().padStart(4, "0")}</span>
              </div>
              <div className="mt-3 space-y-1 font-mono2 text-[11px] text-fog">
                <div className="flex justify-between"><span>dec</span><span className="text-cream">{cp}</span></div>
                <div className="flex justify-between"><span>utf-8</span><span className="text-cream">{bytes}</span></div>
                <div className="flex justify-between"><span>html</span><span className="text-cream">&amp;#{cp};</span></div>
                <div className="flex justify-between"><span>js</span><span className="text-cream">\u{cp.toString(16).toUpperCase().padStart(4, "0")}</span></div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

export const devTools: ToolDef[] = [
  { id: "json-formatter", name: "JSON Formatter", desc: "Validate, beautify, minify and sort keys — with error pinpointing.", category: "dev", icon: Braces, keywords: ["json validator", "prettify", "minify json"], featured: true, Component: JsonTool },
  { id: "regex-tester", name: "Regex Tester", desc: "Live match highlighting, group capture and flag controls.", category: "dev", icon: Regex, keywords: ["regular expression", "regexp", "pattern match"], featured: true, Component: RegexTool },
  { id: "markdown-preview", name: "Markdown Previewer", desc: "Write markdown on the left, see it rendered on the right.", category: "dev", icon: BookOpen, keywords: ["md", "readme", "markdown editor"], Component: Markdown },
  { id: "jwt-decoder", name: "JWT Decoder", desc: "Inspect header, payload and expiry of any JSON Web Token.", category: "dev", icon: ShieldCheck, keywords: ["json web token", "decode jwt", "bearer token"], Component: Jwt },
  { id: "html-entities", name: "HTML Entities", desc: "Encode and decode &, <, >, quotes, emoji and non-ASCII.", category: "dev", icon: Brackets, keywords: ["escape html", "entity encode", "&amp;"], Component: Entities },
  { id: "css-minifier", name: "CSS Minifier / Beautifier", desc: "Shrink stylesheets or re-format them for humans.", category: "dev", icon: Paintbrush, keywords: ["minify css", "beautify css", "compress styles"], Component: CssTool },
  { id: "js-minifier", name: "JS Minifier (Light)", desc: "Strip comments and dead whitespace without touching strings.", category: "dev", icon: Minimize2, keywords: ["minify javascript", "compress js", "strip comments"], Component: JsTool },
  { id: "url-parser", name: "URL Parser", desc: "Break any URL into protocol, host, path and query params.", category: "dev", icon: Network, keywords: ["parse url", "query string", "url components"], Component: UrlParser },
  { id: "cron-parser", name: "Cron Expression Parser", desc: "Understand any cron schedule and preview its next 5 runs.", category: "dev", icon: CalendarClock, keywords: ["crontab", "schedule", "cron job"], featured: true, Component: Cron },
  { id: "chmod-calculator", name: "Chmod Calculator", desc: "Visual rwx grid → octal 755 and symbolic notation.", category: "dev", icon: Lock, keywords: ["file permissions", "755 644", "unix permissions"], Component: Chmod },
  { id: "keyboard-tester", name: "Keyboard Tester", desc: "Press any key to see its event.key, code and keyCode.", category: "dev", icon: Keyboard, keywords: ["key codes", "keycode", "event listener test"], Component: KeyTester },
  { id: "unicode-inspector", name: "Unicode Inspector", desc: "Code points, UTF-8 bytes, HTML entities and JS escapes per character.", category: "dev", icon: Sigma, keywords: ["codepoint", "utf-8", "character info", "emoji bytes"], Component: Unicode },
];
