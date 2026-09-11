/* ── 9 Generators ──────────────────────────────────────────────── */
import { useMemo, useRef, useState } from "react";
import { Key, Fingerprint, Dices, QrCode, Cpu, AtSign, Tags, Shuffle, Users, RefreshCw, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import CryptoJS from "crypto-js";
import type { ToolDef } from "../lib/types";
import { Btn, CopyBtn, In, L, Num, Out, Panel, Seg, Sel, TA, Toggle, useCopy } from "../lib/ui";

/* 1 ─ Password */
const CHARSETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~|" };
function securePick(set: string, n: number): string {
  if (!set.length) return "";
  const out: string[] = [];
  const max = 256 - (256 % set.length);
  const buf = new Uint8Array(n * 2);
  let i = 0;
  while (out.length < n) {
    crypto.getRandomValues(buf);
    for (let j = 0; j < buf.length && out.length < n; j++) if (buf[j] < max) out.push(set[buf[j] % set.length]);
    i++;
    if (i > 10) break;
  }
  return out.join("");
}
function Password() {
  const [len, setLen] = useState(16);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [noAmb, setNoAmb] = useState(false);
  const [count, setCount] = useState(4);
  const [seed, setSeed] = useState(0);
  const charset = useMemo(() => {
    let s = Object.entries(opts).filter(([, v]) => v).map(([k]) => CHARSETS[k as keyof typeof CHARSETS]).join("");
    if (noAmb) s = s.replace(/[l1IO0`'"]/g, "");
    return s;
  }, [opts, noAmb]);
  const pwds = useMemo(() => { void seed; return Array.from({ length: count }, () => securePick(charset, len)); }, [charset, len, count, seed]);
  const entropy = charset.length ? Math.round(len * Math.log2(charset.length)) : 0;
  const strength = entropy < 45 ? ["Weak", "#f87171"] : entropy < 70 ? ["Okay", "#fbbf24"] : entropy < 100 ? ["Strong", "#cdff3d"] : ["Fortress", "#4ade80"];
  const [, copy] = useCopy();
  return (
    <div className="space-y-5">
      <div>
        <L hint={`${len} characters`}>Length</L>
        <input type="range" className="slider" min={4} max={64} value={len} onChange={(e) => setLen(+e.target.value)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        {(Object.keys(CHARSETS) as (keyof typeof CHARSETS)[]).map((k) => (
          <Toggle key={k} on={opts[k]} onChange={(v) => setOpts({ ...opts, [k]: v })} label={{ lower: "abc lower", upper: "ABC upper", digits: "123 digits", symbols: "#$& symbols" }[k]} />
        ))}
        <Toggle on={noAmb} onChange={setNoAmb} label="No l 1 I O 0" />
        <div className="flex items-center gap-2"><span className="text-[13px] text-fog">Count</span><Sel value={count} onChange={(e) => setCount(+e.target.value)} className="!w-20 !py-1.5">{[1, 2, 4, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}</Sel></div>
      </div>
      <Btn v="acid" onClick={() => setSeed(seed + 1)} className="w-full !py-3.5"><RefreshCw size={15} /> Generate passwords</Btn>
      <div className="space-y-2">
        {pwds.map((p, i) => (
          <button key={i} onClick={() => copy(p, `pw${i}`)} className="w-full text-left font-mono2 text-[14px] bg-ink/70 border border-line rounded-xl px-4 py-3 hover:border-acid/50 transition-colors break-all text-cream cursor-pointer group">
            {p} <span className="float-right text-[10px] text-fog group-hover:text-acid uppercase tracking-widest pt-1">copy</span>
          </button>
        ))}
      </div>
      <Panel>
        <div className="flex items-center justify-between mb-2"><span className="text-[13px] text-fog">Entropy</span><span className="font-mono2 text-[13px]" style={{ color: strength[1] }}>{entropy} bits — {strength[0]}</span></div>
        <div className="h-2 bg-ink rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, entropy)}%`, background: strength[1] }} /></div>
      </Panel>
    </div>
  );
}

/* 2 ─ UUID */
function UUID() {
  const [count, setCount] = useState(5);
  const [upper, setUpper] = useState(false);
  const [noHyph, setNoHyph] = useState(false);
  const [seed, setSeed] = useState(0);
  const gen = () => {
    let u = crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16); });
    if (noHyph) u = u.replace(/-/g, "");
    return upper ? u.toUpperCase() : u;
  };
  const ids = useMemo(() => { void seed; return Array.from({ length: count }, gen); }, [count, upper, noHyph, seed]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2"><span className="text-[13px] text-fog">Count</span><Sel value={count} onChange={(e) => setCount(+e.target.value)} className="!w-20 !py-1.5">{[1, 5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}</Sel></div>
        <Toggle on={upper} onChange={setUpper} label="Uppercase" />
        <Toggle on={noHyph} onChange={setNoHyph} label="No hyphens" />
        <Btn v="acid" onClick={() => setSeed(seed + 1)}><RefreshCw size={14} /> Regenerate</Btn>
        <CopyBtn text={ids.join("\n")} label="Copy all" id="uuids" />
      </div>
      <Out value={ids.join("\n")} rows={Math.min(10, count)} copyId="uuids2" />
    </div>
  );
}

/* 3 ─ Random numbers */
function RandomNums() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState(10);
  const [dec, setDec] = useState(0);
  const [unique, setUnique] = useState(false);
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none");
  const [out, setOut] = useState<number[]>([]);
  const generate = () => {
    let lo = Math.min(parseFloat(min) || 0, parseFloat(max) || 0), hi = Math.max(parseFloat(min) || 0, parseFloat(max) || 0);
    const n = Math.min(count, 1000);
    const s = new Set<number>();
    const arr: number[] = [];
    if (unique && dec === 0 && hi - lo + 1 >= n) { while (arr.length < n) { const v = Math.floor(Math.random() * (hi - lo + 1)) + lo; if (!s.has(v)) { s.add(v); arr.push(v); } } }
    else if (unique && dec === 0) { for (let v = lo; v <= hi; v++) arr.push(v); arr.sort(() => Math.random() - 0.5); arr.length = n; }
    else { while (arr.length < n) { const v = Math.random() * (hi - lo) + lo; arr.push(dec ? +v.toFixed(dec) : Math.round(v)); } }
    if (sort === "asc") arr.sort((a, b) => a - b);
    if (sort === "desc") arr.sort((a, b) => b - a);
    setOut(arr);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div><L>Min</L><Num value={min} onChange={(e) => setMin(e.target.value)} /></div>
        <div><L>Max</L><Num value={max} onChange={(e) => setMax(e.target.value)} /></div>
        <div><L>How many</L><Num value={count} onChange={(e) => setCount(Math.min(1000, +e.target.value || 1))} /></div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
        <div className="flex items-center gap-2"><span className="text-[13px] text-fog">Decimals</span><Sel value={dec} onChange={(e) => setDec(+e.target.value)} className="!w-16 !py-1.5">{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</Sel></div>
        <Toggle on={unique} onChange={setUnique} label="Unique only" />
        <Seg options={[{ v: "none", label: "No sort" }, { v: "asc", label: "Asc" }, { v: "desc", label: "Desc" }]} value={sort} onChange={setSort} />
      </div>
      <Btn v="acid" onClick={generate} className="w-full !py-3.5"><Dices size={15} /> Generate</Btn>
      <Out value={out.join(",  ")} rows={4} />
    </div>
  );
}

/* 4 ─ QR code */
function QR() {
  const [text, setText] = useState("https://toolbox.local");
  const [size, setSize] = useState(256);
  const [fg, setFg] = useState("#0a0b0d");
  const [bg, setBg] = useState("#cdff3d");
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const ref = useRef<HTMLDivElement>(null);
  const dl = () => {
    const canvas = ref.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "qrcode.png";
    a.click();
  };
  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div className="space-y-4">
        <div><L>Content</L><TA value={text} onChange={(e) => setText(e.target.value)} className="min-h-24" placeholder="URL, text, Wi-Fi…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><L>Foreground</L><div className="flex gap-2 items-center"><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent cursor-pointer" /><In value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono2 !text-[12px]" /></div></div>
          <div><L>Background</L><div className="flex gap-2 items-center"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent cursor-pointer" /><In value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono2 !text-[12px]" /></div></div>
        </div>
        <div><L hint={`${size}px`}>Size</L><input type="range" className="slider" min={128} max={1024} step={32} value={size} onChange={(e) => setSize(+e.target.value)} /></div>
        <div><L>Error correction</L><Seg options={[{ v: "L", label: "L · 7%" }, { v: "M", label: "M · 15%" }, { v: "Q", label: "Q · 25%" }, { v: "H", label: "H · 30%" }]} value={level} onChange={setLevel} /></div>
      </div>
      <div className="space-y-4">
        <div ref={ref} className="rounded-2xl overflow-hidden border border-line w-fit mx-auto" style={{ background: bg }}>
          <QRCodeCanvas value={text || " "} size={size} bgColor={bg} fgColor={fg} level={level} includeMargin />
        </div>
        <Btn v="acid" onClick={dl} className="w-full !py-3.5"><Download size={15} /> Download PNG</Btn>
      </div>
    </div>
  );
}

/* 5 ─ Hash */
function HashGen() {
  const [t, setT] = useState("hello world");
  const hashes = useMemo(() => {
    if (!t) return null;
    return [
      ["MD5", CryptoJS.MD5(t).toString()],
      ["SHA-1", CryptoJS.SHA1(t).toString()],
      ["SHA-256", CryptoJS.SHA256(t).toString()],
      ["SHA-512", CryptoJS.SHA512(t).toString()],
      ["SHA-3", CryptoJS.SHA3(t).toString()],
      ["RIPEMD-160", CryptoJS.RIPEMD160(t).toString()],
    ] as [string, string][];
  }, [t]);
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Text to hash…" className="min-h-24" />
      {hashes && (
        <div className="space-y-2.5">
          {hashes.map(([name, h]) => (
            <div key={name} className="bg-ink/70 border border-line rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-mono2 text-[11px] text-fog uppercase tracking-widest w-28 shrink-0">{name}</span>
              <code className="flex-1 font-mono2 text-[12px] text-acid break-all">{h}</code>
              <CopyBtn text={h} id={name} />
            </div>
          ))}
        </div>
      )}
      <p className="text-[11.5px] font-mono2 text-fog/60">MD5 & SHA-1 are legacy — use SHA-256+ for anything security-sensitive.</p>
    </div>
  );
}

/* 6 ─ Username */
const ADJ = ["silent", "crimson", "rapid", "cosmic", "mellow", "electric", "midnight", "golden", "savage", "clever", "neon", "misty", "turbo", "velvet", "rogue", "lunar", "arctic", "wicked", "hollow", "swift"];
const NOUN = ["fox", "raven", "tiger", "wolf", "otter", "falcon", "viper", "panda", "lynx", "cobra", "badger", "orca", "hawk", "gecko", "bison", "mantis", "yak", "heron", "drake", "sprite"];
function Username() {
  const [style, setStyle] = useState<"plain" | "under" | "dot" | "num" | "leet">("plain");
  const [seed, setSeed] = useState(0);
  const names = useMemo(() => {
    void seed;
    return Array.from({ length: 12 }, () => {
      const a = ADJ[Math.floor(Math.random() * ADJ.length)], n = NOUN[Math.floor(Math.random() * NOUN.length)];
      const num = Math.floor(Math.random() * 99);
      const leet = (s: string) => s.replace(/a/gi, "4").replace(/e/gi, "3").replace(/o/gi, "0").replace(/i/gi, "1").replace(/s/gi, "5");
      switch (style) {
        case "under": return `${a}_${n}`;
        case "dot": return `${a}.${n}`;
        case "num": return `${a}${n}${num}`;
        case "leet": return `${leet(a)}${leet(n)}${num}`;
        default: return `${a}${n}`;
      }
    });
  }, [style, seed]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Seg options={[{ v: "plain", label: "silentfox" }, { v: "under", label: "silent_fox" }, { v: "dot", label: "silent.fox" }, { v: "num", label: "silentfox42" }, { v: "leet", label: "s1l3ntf0x" }]} value={style} onChange={setStyle} />
        <Btn v="acid" onClick={() => setSeed(seed + 1)}><RefreshCw size={14} /> More</Btn>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {names.map((n, i) => <div key={i} className="bg-ink/70 border border-line rounded-xl px-4 py-3.5 font-mono2 text-[13px] text-cream flex items-center justify-between gap-2 hover:border-acid/40 transition-colors"><span className="break-all">{n}</span><CopyBtn text={n} id={`u${i}${n}`} label="" /></div>)}
      </div>
    </div>
  );
}

/* 7 ─ Meta tags */
function MetaTags() {
  const [f, setF] = useState({ title: "Toolbox — 81 free tools", desc: "Fast, free, no-signup utilities that run entirely in your browser.", url: "https://yoursite.com/tools", img: "https://yoursite.com/og-cover.png", site: "Toolbox", tw: "@yoursite" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const code = `<!-- Primary Meta Tags -->\n<title>${f.title}</title>\n<meta name="title" content="${f.title}" />\n<meta name="description" content="${f.desc}" />\n\n<!-- Open Graph / Facebook -->\n<meta property="og:type" content="website" />\n<meta property="og:url" content="${f.url}" />\n<meta property="og:title" content="${f.title}" />\n<meta property="og:description" content="${f.desc}" />\n<meta property="og:image" content="${f.img}" />\n<meta property="og:site_name" content="${f.site}" />\n\n<!-- Twitter -->\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:url" content="${f.url}" />\n<meta name="twitter:title" content="${f.title}" />\n<meta name="twitter:description" content="${f.desc}" />\n<meta name="twitter:image" content="${f.img}" />\n<meta name="twitter:site" content="${f.tw}" />`;
  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div className="space-y-3.5">
        <div><L hint={`${f.title.length}/60`}>Page title</L><In value={f.title} onChange={set("title")} /></div>
        <div><L hint={`${f.desc.length}/160`}>Description</L><TA value={f.desc} onChange={set("desc")} className="min-h-20" /></div>
        <div><L>Canonical URL</L><In value={f.url} onChange={set("url")} /></div>
        <div><L>OG image URL (1200×630)</L><In value={f.img} onChange={set("img")} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><L>Site name</L><In value={f.site} onChange={set("site")} /></div>
          <div><L>Twitter handle</L><In value={f.tw} onChange={set("tw")} /></div>
        </div>
      </div>
      <div className="space-y-4">
        <L>Google result preview</L>
        <div className="bg-white rounded-xl p-4 text-left">
          <div className="text-[12px] text-[#202124]">{f.url.replace(/^https?:\/\//, "").split("/")[0]}</div>
          <div className="text-[11px] text-[#4d5156] truncate">{f.url}</div>
          <div className="text-[17px] text-[#1a0dab] leading-snug mt-0.5 hover:underline cursor-pointer truncate">{f.title}</div>
          <div className="text-[13px] text-[#4d5156] line-clamp-2 mt-0.5">{f.desc}</div>
        </div>
        <L>Social card preview</L>
        <div className="bg-panel2 border border-line rounded-xl overflow-hidden">
          <div className="h-28 bg-gradient-to-br from-acid/25 to-panel2 flex items-center justify-center text-fog font-mono2 text-[11px]">{f.img ? "1200 × 630 — " + f.img.split("/").pop() : "og:image"}</div>
          <div className="p-3.5 border-t border-line">
            <div className="text-[10.5px] uppercase tracking-wider text-fog">{f.url.replace(/^https?:\/\//, "").split("/")[0]}</div>
            <div className="text-[14px] font-semibold text-cream truncate mt-0.5">{f.title}</div>
            <div className="text-[12.5px] text-fog line-clamp-1">{f.desc}</div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2"><L>Your meta tags</L><Out value={code} rows={8} /></div>
    </div>
  );
}

/* 8 ─ Random strings */
function RandString() {
  const [len, setLen] = useState(12);
  const [count, setCount] = useState(8);
  const [charset, setCharset] = useState("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
  const [seed, setSeed] = useState(0);
  const list = useMemo(() => { void seed; return Array.from({ length: count }, () => securePick(charset, len)); }, [charset, len, count, seed]);
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div><L hint={`${len} chars`}>Length</L><input type="range" className="slider" min={1} max={128} value={len} onChange={(e) => setLen(+e.target.value)} /></div>
        <div><L hint={`${count} strings`}>Count</L><input type="range" className="slider" min={1} max={50} value={count} onChange={(e) => setCount(+e.target.value)} /></div>
      </div>
      <div><L>Character pool</L><In value={charset} onChange={(e) => setCharset(e.target.value)} className="font-mono2 !text-[12px]" /></div>
      <div className="flex flex-wrap gap-2">
        {[["Alphanumeric", "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"], ["Hex", "0123456789abcdef"], ["Digits", "0123456789"], ["Letters", "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"], ["Safe symbols", "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"]].map(([n, s]) => (
          <Btn key={n} v="soft" className="!text-[12px]" onClick={() => setCharset(s)}>{n}</Btn>
        ))}
      </div>
      <Btn v="acid" onClick={() => setSeed(seed + 1)}><RefreshCw size={14} /> Regenerate</Btn>
      <Out value={list.join("\n")} rows={8} copyId="rstr" />
    </div>
  );
}

/* 9 ─ Fake data */
const FIRST = ["Ava", "Liam", "Maya", "Noah", "Zoe", "Ethan", "Ruby", "Owen", "Iris", "Leo", "Nora", "Felix", "June", "Hugo", "Cleo", "Max"];
const LAST = ["Reyes", "Kim", "Novak", "Singh", "Moreau", "Silva", "Berg", "Okafor", "Lindgren", "Costa", "Webb", "Sato", "Fischer", "Adeyemi", "Marsh", "Vega"];
const CO = ["Nimbus Labs", "Ferrostack", "Bluepine", "Quokka Co", "Halcyon", "Vantablack", "Loopwise", "Coldbrew Inc", "Framely", "Octane Co"];
const TLD = ["com", "io", "dev", "co", "net"];
const COUNTRIES = ["USA", "UK", "Germany", "Japan", "Brazil", "Canada", "India", "France", "Australia", "Spain", "Kenya", "Norway"];
function FakeData() {
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState(0);
  const rows = useMemo(() => {
    void seed;
    const r = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    return Array.from({ length: count }, () => {
      const first = r(FIRST), last = r(LAST);
      return {
        name: `${first} ${last}`,
        username: `${first.toLowerCase()}.${last.toLowerCase()}${Math.floor(Math.random() * 90)}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${["gmail", "outlook", "mail", "hey"][Math.floor(Math.random() * 4)]}.${r(TLD)}`,
        phone: `+1 (${200 + Math.floor(Math.random() * 700)}) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        company: r(CO),
        country: r(COUNTRIES),
      };
    });
  }, [count, seed]);
  const csv = ["name,username,email,phone,company,country", ...rows.map((r) => `"${r.name}","${r.username}","${r.email}","${r.phone}","${r.company}","${r.country}"`)].join("\n");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Sel value={count} onChange={(e) => setCount(+e.target.value)} className="!w-32">{[5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>{n} rows</option>)}</Sel>
        <Btn v="acid" onClick={() => setSeed(seed + 1)}><RefreshCw size={14} /> Regenerate</Btn>
        <CopyBtn text={JSON.stringify(rows, null, 2)} label="Copy JSON" id="fj" />
        <CopyBtn text={csv} label="Copy CSV" id="fc" />
      </div>
      <div className="overflow-x-auto border border-line rounded-xl">
        <table className="w-full text-[12.5px]">
          <thead><tr className="bg-panel2 text-left font-mono2 text-[10.5px] uppercase tracking-widest text-fog">{["Name", "Username", "Email", "Phone", "Company", "Country"].map((h) => <th key={h} className="px-3.5 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} className="border-t border-line hover:bg-panel2/60 transition-colors">
              <td className="px-3.5 py-2 text-cream">{r.name}</td><td className="px-3.5 py-2 font-mono2 text-fog">{r.username}</td>
              <td className="px-3.5 py-2 font-mono2 text-acid/90">{r.email}</td><td className="px-3.5 py-2 font-mono2 text-fog">{r.phone}</td>
              <td className="px-3.5 py-2 text-fog">{r.company}</td><td className="px-3.5 py-2 text-fog">{r.country}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

export const genTools: ToolDef[] = [
  { id: "password-generator", name: "Password Generator", desc: "Cryptographically secure passwords with live entropy meter.", category: "generate", icon: Key, keywords: ["strong password", "secure random", "passphrase"], featured: true, Component: Password },
  { id: "uuid-generator", name: "UUID Generator", desc: "Bulk v4 UUIDs with case and hyphen options — copy one or all.", category: "generate", icon: Fingerprint, keywords: ["guid", "unique id", "uuid v4"], Component: UUID },
  { id: "random-number", name: "Random Number Generator", desc: "Integers or decimals in any range — unique, sorted, bulk.", category: "generate", icon: Dices, keywords: ["rng", "random integer", "lottery number", "pick a number"], Component: RandomNums },
  { id: "qr-code-generator", name: "QR Code Generator", desc: "Custom colors and error correction, downloadable as PNG.", category: "generate", icon: QrCode, keywords: ["qr code", "barcode", "scan me"], featured: true, Component: QR },
  { id: "hash-generator", name: "Hash Generator", desc: "MD5, SHA-1, SHA-256, SHA-512 and more from any text.", category: "generate", icon: Cpu, keywords: ["md5", "sha256", "checksum", "digest"], Component: HashGen },
  { id: "username-generator", name: "Username Generator", desc: "Cool handle ideas in five styles — plain, underscored or leet.", category: "generate", icon: AtSign, keywords: ["gamertag", "handle", "nickname ideas"], Component: Username },
  { id: "meta-tag-generator", name: "Meta Tag Generator", desc: "Open Graph & Twitter tags with live Google and social previews.", category: "generate", icon: Tags, keywords: ["og tags", "seo meta", "twitter card"], Component: MetaTags },
  { id: "random-string", name: "Random String Generator", desc: "Custom character pools, lengths and bulk quantities.", category: "generate", icon: Shuffle, keywords: ["random token", "api key", "random characters"], Component: RandString },
  { id: "fake-data-generator", name: "Fake Data Generator", desc: "Realistic names, emails, phones and companies — copy as JSON or CSV.", category: "generate", icon: Users, keywords: ["mock data", "test data", "dummy users", "sample data"], featured: true, Component: FakeData },
];
