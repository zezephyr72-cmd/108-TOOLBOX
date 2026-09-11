/* ── 13 Text tools ─────────────────────────────────────────────── */
import { useMemo, useState } from "react";
import { Type, CaseSensitive, ArrowLeftRight, Layers, ArrowDownAZ, Eraser, Replace, ChartColumn, Repeat2, Split, Binary, CircleSlash, Link2, FileText } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, L, Out, Panel, Seg, Stat, TA, Toggle, In } from "../lib/ui";

/* 1 ─ Word counter */
function WordCounter() {
  const [t, setT] = useState("");
  const s = useMemo(() => {
    const words = t.trim() ? t.trim().split(/\s+/).length : 0;
    const chars = t.length;
    const noSpaces = t.replace(/\s/g, "").length;
    const sentences = (t.match(/[.!?…]+(\s|$)/g) || []).length;
    const paragraphs = t.trim() ? t.trim().split(/\n\s*\n/).length : 0;
    const lines = t ? t.split("\n").length : 0;
    const read = words / 200, speak = words / 130;
    const time = (m: number) => (m < 1 ? `${Math.ceil(m * 60)}s` : `${Math.floor(m)}m ${Math.ceil((m % 1) * 60)}s`);
    return { words, chars, noSpaces, sentences, paragraphs, lines, read: words ? time(read) : "0s", speak: words ? time(speak) : "0s" };
  }, [t]);
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Start typing or paste your text here…" className="min-h-44" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Words" value={s.words} accent /><Stat label="Characters" value={s.chars} />
        <Stat label="No spaces" value={s.noSpaces} /><Stat label="Sentences" value={s.sentences} />
        <Stat label="Paragraphs" value={s.paragraphs} /><Stat label="Lines" value={s.lines} />
        <Stat label="Reading time" value={s.read} /><Stat label="Speaking time" value={s.speak} />
      </div>
    </div>
  );
}

/* 2 ─ Case converter */
function CaseConv() {
  const [t, setT] = useState("the quick brown fox jumps over the lazy dog");
  const words = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) || [];
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const modes: [string, (s: string) => string][] = [
    ["UPPERCASE", (s) => s.toUpperCase()],
    ["lowercase", (s) => s.toLowerCase()],
    ["Title Case", (s) => s.toLowerCase().replace(/\w\S*/g, cap)],
    ["Sentence case", (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())],
    ["camelCase", (s) => words(s).map((w, i) => (i ? cap(w) : w)).join("")],
    ["PascalCase", (s) => words(s).map(cap).join("")],
    ["snake_case", (s) => words(s).join("_")],
    ["kebab-case", (s) => words(s).join("-")],
    ["CONSTANT_CASE", (s) => words(s).join("_").toUpperCase()],
    ["aLtErNaTiNg", (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join("")],
    ["InVeRsE", (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("")],
    ["dot.case", (s) => words(s).join(".")],
  ];
  const [out, setOut] = useState("");
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Type something…" />
      <div className="flex flex-wrap gap-2">
        {modes.map(([n, f]) => (
          <Btn key={n} v="soft" onClick={() => setOut(f(t))} className="font-mono2 !text-[12px]">{n}</Btn>
        ))}
      </div>
      <Out value={out} />
    </div>
  );
}

/* 3 ─ Text reverser */
function Reverser() {
  const [t, setT] = useState("");
  const [mode, setMode] = useState<"chars" | "words" | "lines">("chars");
  const out = useMemo(() => {
    if (mode === "chars") return [...t].reverse().join("");
    if (mode === "words") return t.split(/(\s+)/).reverse().join("");
    return t.split("\n").reverse().join("\n");
  }, [t, mode]);
  return (
    <div className="space-y-4">
      <Seg options={[{ v: "chars", label: "Characters" }, { v: "words", label: "Words" }, { v: "lines", label: "Lines" }]} value={mode} onChange={setMode} />
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Text to flip…" />
      <Out value={out} />
    </div>
  );
}

/* 4 ─ Duplicate line remover */
function Dedupe() {
  const [t, setT] = useState("");
  const [icase, setIcase] = useState(true);
  const [trim, setTrim] = useState(true);
  const { out, removed } = useMemo(() => {
    const seen = new Set<string>();
    let removed = 0;
    const kept = t.split("\n").filter((l) => {
      const key = (trim ? l.trim() : l)[icase ? "toLowerCase" : "toString"]();
      if (!key) return true;
      if (seen.has(key)) { removed++; return false; }
      seen.add(key); return true;
    });
    return { out: kept.join("\n"), removed };
  }, [t, icase, trim]);
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="One item per line…" />
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
        <Toggle on={icase} onChange={setIcase} label="Ignore case" />
        <Toggle on={trim} onChange={setTrim} label="Trim whitespace" />
        {t && <span className="text-[12px] font-mono2 text-acid">removed {removed} duplicate{removed === 1 ? "" : "s"}</span>}
      </div>
      <Out value={out} />
    </div>
  );
}

/* 5 ─ Line sorter */
function Sorter() {
  const [t, setT] = useState("");
  type M = "az" | "za" | "lu" | "ld" | "num" | "rev" | "rnd";
  const [m, setM] = useState<M>("az");
  const out = useMemo(() => {
    const a = t.split("\n");
    const L = { az: () => a.sort((x, y) => x.localeCompare(y)), za: () => a.sort((x, y) => y.localeCompare(x)), lu: () => a.sort((x, y) => x.length - y.length), ld: () => a.sort((x, y) => y.length - x.length), num: () => a.sort((x, y) => (parseFloat(x) || 0) - (parseFloat(y) || 0)), rev: () => a.reverse(), rnd: () => a.sort(() => Math.random() - 0.5) };
    L[m]();
    return a.join("\n");
  }, [t, m]);
  return (
    <div className="space-y-4">
      <Seg options={[{ v: "az", label: "A → Z" }, { v: "za", label: "Z → A" }, { v: "lu", label: "Shortest" }, { v: "ld", label: "Longest" }, { v: "num", label: "Numeric" }, { v: "rev", label: "Reverse" }, { v: "rnd", label: "Shuffle" }]} value={m} onChange={setM} />
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="One item per line…" />
      <Out value={out} />
    </div>
  );
}

/* 6 ─ Lorem ipsum */
const LOREM = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
function Lorem() {
  const [n, setN] = useState(3);
  const [mode, setMode] = useState<"p" | "s" | "w">("p");
  const [classic, setClassic] = useState(true);
  const [html, setHtml] = useState(false);
  const [seed, setSeed] = useState(0);
  const rnd = () => LOREM[Math.floor(Math.random() * LOREM.length)];
  const out = useMemo(() => {
    void seed;
    const sentence = () => { const len = 6 + Math.floor(Math.random() * 10); let s = Array.from({ length: len }, rnd).join(" "); return s.charAt(0).toUpperCase() + s.slice(1) + "."; };
    const para = () => Array.from({ length: 3 + Math.floor(Math.random() * 3) }, sentence).join(" ");
    let body = "";
    if (mode === "w") { body = Array.from({ length: n }, rnd).join(" "); }
    else if (mode === "s") body = Array.from({ length: n }, sentence).join(" ");
    else body = Array.from({ length: n }, para).map((p) => (html ? `<p>${p}</p>` : p)).join(html ? "\n" : "\n\n");
    if (classic && body) body = "Lorem ipsum dolor sit amet, consectetur adipiscing elit" + (mode === "w" ? " " + body.split(" ").slice(7).join(" ") : mode === "s" ? " " + body.split(". ").slice(1).join(". ") : body.slice(2));
    return body;
  }, [n, mode, classic, html, seed]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <Seg options={[{ v: "p", label: "Paragraphs" }, { v: "s", label: "Sentences" }, { v: "w", label: "Words" }]} value={mode} onChange={setMode} />
        <div className="flex items-center gap-3 min-w-40">
          <input type="range" className="slider" min={1} max={mode === "w" ? 100 : 10} value={n} onChange={(e) => setN(+e.target.value)} />
          <span className="font-mono2 text-acid text-sm w-6">{n}</span>
        </div>
        <Btn v="acid" onClick={() => setSeed(seed + 1)}>Regenerate</Btn>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Toggle on={classic} onChange={setClassic} label='Start with "Lorem ipsum…"' />
        {mode === "p" && <Toggle on={html} onChange={setHtml} label="Wrap in <p> tags" />}
      </div>
      <Out value={out} rows={8} mono={html} />
    </div>
  );
}

/* 7 ─ Slug generator */
function Slug() {
  const [t, setT] = useState("");
  const [lower, setLower] = useState(true);
  const out = useMemo(() => {
    let s = t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-");
    return lower ? s.toLowerCase() : s;
  }, [t, lower]);
  return (
    <div className="space-y-4">
      <L hint="e.g. My Blog Post! → my-blog-post">Your title</L>
      <In value={t} onChange={(e) => setT(e.target.value)} placeholder="10 Tips for Better Sleep (2026 Edition)" />
      <Toggle on={lower} onChange={setLower} label="Lowercase" />
      <Out value={out} mono />
    </div>
  );
}

/* 8 ─ Whitespace cleaner */
function Whitespace() {
  const [t, setT] = useState("");
  const [trim, setTrim] = useState(true);
  const [collapse, setCollapse] = useState(true);
  const [blank, setBlank] = useState(true);
  const [tabs, setTabs] = useState(false);
  const [all, setAll] = useState(false);
  const out = useMemo(() => {
    let s = t;
    if (tabs) s = s.replace(/\t/g, "  ");
    if (trim) s = s.split("\n").map((l) => l.replace(/\s+$/g, "")).join("\n");
    if (collapse) s = s.replace(/[^\S\n]+/g, " ");
    if (blank) s = s.replace(/\n{3,}/g, "\n\n").replace(/^\n+|\n+$/g, "");
    if (all) s = s.replace(/\s+/g, "");
    return s;
  }, [t, trim, collapse, blank, tabs, all]);
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Paste messy text…" />
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Toggle on={trim} onChange={setTrim} label="Trim line ends" />
        <Toggle on={collapse} onChange={setCollapse} label="Collapse spaces" />
        <Toggle on={blank} onChange={setBlank} label="Remove extra blank lines" />
        <Toggle on={tabs} onChange={setTabs} label="Tabs → spaces" />
        <Toggle on={all} onChange={setAll} label="Remove ALL whitespace" />
      </div>
      <Out value={out} />
      {t && <p className="text-[12px] font-mono2 text-acid">{t.length - out.length >= 0 ? `${t.length - out.length} characters removed` : `${out.length - t.length} added`}</p>}
    </div>
  );
}

/* 9 ─ Find & replace */
function FindReplace() {
  const [t, setT] = useState("");
  const [find, setFind] = useState("");
  const [rep, setRep] = useState("");
  const [cs, setCs] = useState(false);
  const [rx, setRx] = useState(false);
  const { out, count, err } = useMemo(() => {
    if (!find) return { out: "", count: 0, err: "" };
    try {
      const re = new RegExp(rx ? find : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), cs ? "g" : "gi");
      const matches = t.match(re);
      return { out: t.replace(re, rx ? rep : rep.replace(/\$/g, "$$$$")), count: matches ? matches.length : 0, err: "" };
    } catch (e) { return { out: "", count: 0, err: (e as Error).message }; }
  }, [t, find, rep, cs, rx]);
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Your text…" />
      <div className="grid sm:grid-cols-2 gap-3">
        <div><L>Find</L><In value={find} onChange={(e) => setFind(e.target.value)} placeholder={rx ? "regular expression" : "text to find"} className="font-mono2" /></div>
        <div><L>Replace with</L><In value={rep} onChange={(e) => setRep(e.target.value)} placeholder="replacement" className="font-mono2" /></div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
        <Toggle on={cs} onChange={setCs} label="Case sensitive" />
        <Toggle on={rx} onChange={setRx} label="Regex mode" />
        {count > 0 && <span className="text-[12px] font-mono2 text-acid">{count} match{count === 1 ? "" : "es"} replaced</span>}
      </div>
      {err && <p className="text-[12px] font-mono2 text-red-400">{err}</p>}
      <Out value={out} />
    </div>
  );
}

/* 10 ─ Letter frequency */
function Freq() {
  const [t, setT] = useState("");
  const [lettersOnly, setLettersOnly] = useState(true);
  const data = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of t.toLowerCase()) {
      if (lettersOnly && !/[a-z]/.test(c)) continue;
      if (!lettersOnly && c === " ") continue;
      m.set(c, (m.get(c) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  }, [t, lettersOnly]);
  const max = data[0]?.[1] || 1;
  return (
    <div className="space-y-4">
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Paste text to analyze…" />
      <Toggle on={lettersOnly} onChange={setLettersOnly} label="Letters only (a–z)" />
      {data.length > 0 && (
        <Panel className="!p-4 space-y-1.5">
          {data.map(([c, n]) => (
            <div key={c} className="flex items-center gap-3">
              <span className="font-mono2 text-[12px] text-acid w-5 text-center">{c === " " ? "␣" : c}</span>
              <div className="flex-1 h-[18px] bg-ink/60 rounded-md overflow-hidden">
                <div className="h-full bg-acid/80 rounded-md transition-all duration-500" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="font-mono2 text-[11px] text-fog w-14 text-right tabular-nums">{n} · {((n / t.replace(/\s/g, "").length) * 100 || 0).toFixed(1)}%</span>
            </div>
          ))}
        </Panel>
      )}
    </div>
  );
}

/* 11 ─ Palindrome */
function Palindrome() {
  const [t, setT] = useState("A man, a plan, a canal: Panama");
  const clean = t.toLowerCase().replace(/[^a-z0-9]/g, "");
  const is = clean.length > 0 && clean === [...clean].reverse().join("");
  const examples = ["racecar", "No lemon, no melon", "Was it a car or a cat I saw?", "Madam, in Eden, I'm Adam"];
  return (
    <div className="space-y-4">
      <In value={t} onChange={(e) => setT(e.target.value)} placeholder="Type a phrase…" />
      {t && (
        <Panel className="text-center !py-10">
          <div className={`text-3xl sm:text-4xl font-bold tracking-tight ${is ? "text-acid" : "text-red-400"}`}>{is ? "It's a palindrome ✓" : "Not a palindrome"}</div>
          <p className="mt-3 font-mono2 text-[13px] text-fog break-all">{clean}</p>
          <p className="font-mono2 text-[13px] text-fog/50 break-all">{(is ? [...clean].reverse().join("") : [...clean].reverse().join(""))}</p>
        </Panel>
      )}
      <div className="flex flex-wrap gap-2">
        {examples.map((e) => <Btn key={e} v="soft" onClick={() => setT(e)} className="!text-[12px]">{e}</Btn>)}
      </div>
    </div>
  );
}

/* 12 ─ Text diff */
function lcs(a: string[], b: string[]) {
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const rows: { t: "same" | "add" | "del"; s: string }[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { rows.push({ t: "same", s: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { rows.push({ t: "del", s: a[i] }); i++; }
    else { rows.push({ t: "add", s: b[j] }); j++; }
  }
  while (i < n) rows.push({ t: "del", s: a[i++] });
  while (j < m) rows.push({ t: "add", s: b[j++] });
  return rows;
}
function Diff() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const rows = useMemo(() => (a || b ? lcs(a.split("\n").slice(0, 400), b.split("\n").slice(0, 400)) : []), [a, b]);
  const adds = rows.filter((r) => r.t === "add").length, dels = rows.filter((r) => r.t === "del").length;
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><L>Original</L><TA value={a} onChange={(e) => setA(e.target.value)} className="min-h-32" /></div>
        <div><L>Changed</L><TA value={b} onChange={(e) => setB(e.target.value)} className="min-h-32" /></div>
      </div>
      {rows.length > 0 && (
        <>
          <p className="text-[12px] font-mono2 text-fog"><span className="text-green-400">+{adds} additions</span> · <span className="text-red-400">−{dels} removals</span> · {rows.filter((r) => r.t === "same").length} unchanged</p>
          <div className="bg-ink/70 border border-line rounded-xl overflow-hidden font-mono2 text-[12.5px] leading-relaxed max-h-[420px] overflow-y-auto">
            {rows.map((r, i) => (
              <div key={i} className={`px-4 py-[3px] flex gap-3 ${r.t === "add" ? "diff-add" : r.t === "del" ? "diff-del" : "text-fog"}`}>
                <span className="w-4 shrink-0 select-none opacity-60">{r.t === "add" ? "+" : r.t === "del" ? "−" : " "}</span>
                <span className="whitespace-pre-wrap break-all">{r.s || " "}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* 13 ─ Text ↔ Binary */
function TextBinary() {
  const [mode, setMode] = useState<"enc" | "dec">("enc");
  const [t, setT] = useState("");
  const { out, err } = useMemo(() => {
    try {
      if (!t.trim()) return { out: "", err: "" };
      if (mode === "enc") return { out: [...t].map((c) => (c.codePointAt(0) || 0).toString(2).padStart(8, "0")).join(" "), err: "" };
      const parts = t.trim().split(/\s+/);
      if (!parts.every((p) => /^[01]{1,16}$/.test(p))) return { out: "", err: "Binary must be groups of 0s and 1s separated by spaces." };
      return { out: parts.map((p) => String.fromCodePoint(parseInt(p, 2))).join(""), err: "" };
    } catch (e) { return { out: "", err: (e as Error).message }; }
  }, [t, mode]);
  return (
    <div className="space-y-4">
      <Seg options={[{ v: "enc", label: "Text → Binary" }, { v: "dec", label: "Binary → Text" }]} value={mode} onChange={setMode} />
      <TA value={t} onChange={(e) => setT(e.target.value)} placeholder={mode === "enc" ? "Hello world" : "01001000 01100101 01101100 01101100 01101111"} />
      {err && <p className="text-[12px] font-mono2 text-red-400">{err}</p>}
      <Out value={out} />
    </div>
  );
}

export const textTools: ToolDef[] = [
  { id: "word-counter", name: "Word Counter", desc: "Words, characters, sentences, paragraphs and reading time — live as you type.", category: "text", icon: Type, keywords: ["character count", "reading time", "letters", "essay length"], featured: true, Component: WordCounter },
  { id: "case-converter", name: "Case Converter", desc: "Switch text between UPPERCASE, camelCase, snake_case, Title Case and 8 more styles.", category: "text", icon: CaseSensitive, keywords: ["uppercase", "lowercase", "title case", "camelcase", "snake_case", "capital"], Component: CaseConv },
  { id: "text-reverser", name: "Text Reverser", desc: "Flip text backwards by characters, words, or entire lines.", category: "text", icon: ArrowLeftRight, keywords: ["reverse string", "backwards", "flip", "mirror"], Component: Reverser },
  { id: "remove-duplicate-lines", name: "Duplicate Line Remover", desc: "Clean lists by deleting repeated lines, with case and trim options.", category: "text", icon: Layers, keywords: ["dedupe", "unique lines", "clean list", "delete repeats"], Component: Dedupe },
  { id: "line-sorter", name: "Line Sorter", desc: "Sort lines alphabetically, numerically, by length — or shuffle them.", category: "text", icon: ArrowDownAZ, keywords: ["alphabetize", "sort list", "order", "shuffle lines"], Component: Sorter },
  { id: "lorem-ipsum", name: "Lorem Ipsum Generator", desc: "Placeholder text in paragraphs, sentences or words, with HTML output.", category: "text", icon: FileText, keywords: ["placeholder text", "dummy text", "filler", "ipsum"], Component: Lorem },
  { id: "slug-generator", name: "URL Slug Generator", desc: "Turn any title into a clean, SEO-friendly URL slug.", category: "text", icon: Link2, keywords: ["seo", "permalink", "url friendly", "blog slug"], Component: Slug },
  { id: "whitespace-cleaner", name: "Whitespace Cleaner", desc: "Trim lines, collapse double spaces, kill blank lines and convert tabs.", category: "text", icon: Eraser, keywords: ["remove spaces", "trim", "clean whitespace", "extra spaces"], Component: Whitespace },
  { id: "find-replace", name: "Find & Replace", desc: "Search and replace across big text blocks — with regex superpowers.", category: "text", icon: Replace, keywords: ["search replace", "regex replace", "substitute text"], Component: FindReplace },
  { id: "letter-frequency", name: "Letter Frequency Analyzer", desc: "Visualize how often each character appears in your text.", category: "text", icon: ChartColumn, keywords: ["letter count", "character analysis", "cipher", "histogram"], Component: Freq },
  { id: "palindrome-checker", name: "Palindrome Checker", desc: "Test whether a phrase reads the same forwards and backwards.", category: "text", icon: Repeat2, keywords: ["palindrome test", "reverse words", "same backwards"], Component: Palindrome },
  { id: "text-diff", name: "Text Diff Checker", desc: "Compare two texts line-by-line and highlight every change.", category: "text", icon: Split, keywords: ["compare text", "difference", "changes", "merge"], featured: true, Component: Diff },
  { id: "text-to-binary", name: "Text ↔ Binary", desc: "Encode text to binary bytes or decode 0s and 1s back to text.", category: "text", icon: Binary, keywords: ["binary converter", "ascii binary", "01101000", "encode decode"], Component: TextBinary },
  { id: "punctuation-remover", name: "Punctuation Remover", desc: "Strip every punctuation mark from text in one click.", category: "text", icon: CircleSlash, keywords: ["remove commas", "strip punctuation", "clean symbols"], Component: () => {
    const [t, setT] = useState("");
    const out = t.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~—–“”‘’…]/g, "");
    return (
      <div className="space-y-4">
        <TA value={t} onChange={(e) => setT(e.target.value)} placeholder="Paste text with punctuation…" />
        {t && <p className="text-[12px] font-mono2 text-acid">{t.length - out.length} marks removed</p>}
        <Out value={out} />
      </div>
    );
  } },
];
