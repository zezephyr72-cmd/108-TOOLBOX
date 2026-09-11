/* ── 8 Time tools ──────────────────────────────────────────────── */
import { useEffect, useMemo, useRef, useState } from "react";
import { Watch, Hourglass, Globe, AlarmClock, BellRing, Calendar, Briefcase, Clock, Play, Pause, RotateCcw, Flag, Sun, Moon, X } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, In, L, Num, Panel, Row, Seg, Sel, cx } from "../lib/ui";

const pad = (n: number, l = 2) => String(n).padStart(l, "0");
const msFmt = (ms: number) => `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}.${pad(Math.floor(ms / 10) % 100)}`;

function beep(times = 3, freq = 880) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      const t = ctx.currentTime + i * 0.35;
      g.gain.setValueAtTime(0.001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + 0.3);
    }
  } catch { /* audio blocked */ }
}

/* 1 ─ Stopwatch */
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const acc = useRef(0); const startAt = useRef(0); const raf = useRef(0);
  const tick = () => { setElapsed(acc.current + performance.now() - startAt.current); raf.current = requestAnimationFrame(tick); };
  const start = () => { startAt.current = performance.now(); setRunning(true); raf.current = requestAnimationFrame(tick); };
  const pause = () => { acc.current = elapsed; cancelAnimationFrame(raf.current); setRunning(false); };
  const reset = () => { cancelAnimationFrame(raf.current); setRunning(false); setElapsed(0); acc.current = 0; setLaps([]); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <div className="space-y-5">
      <Panel className="text-center !py-12">
        <div className="font-mono2 text-5xl sm:text-7xl font-bold tabular-nums tracking-tight text-cream">{msFmt(elapsed)}</div>
        <div className="mt-3 text-[11px] font-mono2 uppercase tracking-[0.25em] text-fog">{running ? <span className="text-acid">● running</span> : laps.length ? `${laps.length} laps` : "ready"}</div>
      </Panel>
      <div className="flex flex-wrap gap-2.5">
        <Btn v="acid" onClick={running ? pause : start} className="flex-1 !py-3.5">{running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {elapsed > 0 ? "Resume" : "Start"}</>}</Btn>
        <Btn v="ghost" onClick={() => setLaps((l) => [elapsed, ...l])} disabled={!running} className="flex-1 !py-3.5"><Flag size={15} /> Lap</Btn>
        <Btn v="soft" onClick={reset} className="!py-3.5"><RotateCcw size={15} /></Btn>
      </div>
      {laps.length > 0 && (
        <Panel>
          {laps.map((l, i) => (
            <Row key={i} k={`Lap ${laps.length - i}`} v={<span><span className="text-fog mr-3">+{msFmt(i < laps.length - 1 ? l - laps[i + 1] : l)}</span>{msFmt(l)}</span>} />
          ))}
        </Panel>
      )}
    </div>
  );
}

/* 2 ─ Countdown timer */
function Countdown() {
  const [hms, setHms] = useState({ h: "0", m: "5", s: "0" });
  const [remaining, setRemaining] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<number>(0);
  const endAt = useRef(0);
  useEffect(() => () => clearInterval(ref.current), []);
  const tick = () => {
    clearInterval(ref.current);
    setRunning(true);
    ref.current = window.setInterval(() => {
      const left = endAt.current - Date.now();
      if (left <= 0) { clearInterval(ref.current); setRemaining(0); setRunning(false); beep(4); }
      else setRemaining(left);
    }, 100);
  };
  const begin = () => {
    // resume if paused mid-countdown
    if (remaining !== null && remaining > 0 && remaining < total) {
      endAt.current = Date.now() + remaining;
      tick();
      return;
    }
    const ms = ((+hms.h || 0) * 3600 + (+hms.m || 0) * 60 + (+hms.s || 0)) * 1000;
    if (ms <= 0) return;
    setTotal(ms); endAt.current = Date.now() + ms; setRemaining(ms);
    tick();
  };
  const stop = () => { clearInterval(ref.current); setRunning(false); };
  const reset = () => { stop(); setRemaining(null); };
  const pct = total ? (remaining ?? total) / total : 0;
  const disp = remaining === null ? ((+hms.h || 0) * 3600 + (+hms.m || 0) * 60 + (+hms.s || 0)) * 1000 : remaining;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {([["h", "Hours"], ["m", "Minutes"], ["s", "Seconds"]] as const).map(([k, lbl]) => (
          <div key={k}><L>{lbl}</L><Num value={hms[k]} onChange={(e) => { setHms({ ...hms, [k]: e.target.value }); reset(); }} className="text-center !text-xl !py-4 font-bold" /></div>
        ))}
      </div>
      <Panel className="text-center !py-10 relative overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 bg-acid/10 transition-all duration-150" style={{ height: `${pct * 100}%` }} />
        <div className={cx("relative font-mono2 text-5xl sm:text-7xl font-bold tabular-nums", remaining === 0 ? "text-acid" : "text-cream")}>
          {remaining === 0 ? "TIME!" : msFmt(Math.max(0, disp)).slice(0, 8)}
        </div>
      </Panel>
      <div className="flex gap-2.5">
        <Btn v="acid" onClick={running ? stop : begin} className="flex-1 !py-3.5">{running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {remaining !== null && remaining > 0 && remaining < total ? "Resume" : "Start"}</>}</Btn>
        <Btn v="soft" onClick={reset} className="!py-3.5"><RotateCcw size={15} /></Btn>
      </div>
      <div className="flex flex-wrap gap-2">{[1, 5, 10, 15, 25, 45].map((m) => <Btn key={m} v="soft" className="!text-[12px]" onClick={() => { setHms({ h: "0", m: String(m), s: "0" }); reset(); }}>{m} min</Btn>)}</div>
    </div>
  );
}

/* 3 ─ World clock */
const CITIES = [["New York", "America/New_York"], ["Los Angeles", "America/Los_Angeles"], ["London", "Europe/London"], ["Paris", "Europe/Paris"], ["Dubai", "Asia/Dubai"], ["Mumbai", "Asia/Kolkata"], ["Singapore", "Asia/Singapore"], ["Tokyo", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"], ["São Paulo", "America/Sao_Paulo"], ["Berlin", "Europe/Berlin"], ["Hong Kong", "Asia/Hong_Kong"]] as const;
function WorldClock() {
  const [cities, setCities] = useState<string[]>(["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"]);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const localOffset = -now.getTimezoneOffset() * 60000;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Sel value="" onChange={(e) => { if (e.target.value && !cities.includes(e.target.value)) setCities([...cities, e.target.value]); }} className="flex-1">
          <option value="">+ Add a city…</option>
          {CITIES.filter(([, tz]) => !cities.includes(tz)).map(([n, tz]) => <option key={tz} value={tz}>{n}</option>)}
        </Sel>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {cities.map((tz) => {
          const name = CITIES.find((c) => c[1] === tz)?.[0] || tz.split("/")[1].replace(/_/g, " ");
          const t = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
          const offset = (getOffset(tz, now) - localOffset) / 3600000;
          const hour = +t.slice(0, 2) % 24;
          const day = hour >= 6 && hour < 20;
          return (
            <Panel key={tz} className="relative group">
              <button onClick={() => setCities(cities.filter((c) => c !== tz))} className="absolute top-3 right-3 text-fog hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-1"><X size={13} /></button>
              <div className="flex items-center gap-2 text-[13px] text-fog">
                {day ? <Sun size={13} className="text-acid" /> : <Moon size={13} className="text-fog" />} {name}
                <span className="text-[10.5px] font-mono2 text-fog/60">{offset >= 0 ? "+" : ""}{Math.round(offset * 10) / 10}h vs you</span>
              </div>
              <div className="mt-1.5 font-mono2 text-3xl font-bold tabular-nums text-cream">{t}</div>
            </Panel>
          );
        })}
      </div>
      <p className="text-[11.5px] font-mono2 text-fog/60">times computed with your system timezone database — DST aware</p>
    </div>
  );
}
function getOffset(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const parts = Object.fromEntries(dtf.formatToParts(date).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return asUTC - date.getTime();
}

/* 4 ─ Pomodoro */
function Pomodoro() {
  const [dur, setDur] = useState({ focus: 25, short: 5, long: 15 });
  const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const ref = useRef(0);
  useEffect(() => () => clearInterval(ref.current), []);
  const total = dur[mode] * 60;
  const switchMode = (m: "focus" | "short" | "long") => { setMode(m); setLeft(dur[m] * 60); setRunning(false); clearInterval(ref.current); };
  const toggle = () => {
    if (running) { clearInterval(ref.current); setRunning(false); return; }
    setRunning(true);
    ref.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          beep(3, 980);
          clearInterval(ref.current);
          setRunning(false);
          if (mode === "focus") { const nd = done + 1; setDone(nd); const nxt = nd % 4 === 0 ? "long" : "short"; setMode(nxt); setTimeout(() => setLeft(dur[nxt] * 60), 50); }
          else { setMode("focus"); setTimeout(() => setLeft(dur.focus * 60), 50); }
          return 0;
        }
        return l - 1;
      });
    }, 1000);
  };
  const R = 110, circ = 2 * Math.PI * R;
  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <Seg options={[{ v: "focus", label: `Focus ${dur.focus}m` }, { v: "short", label: `Break ${dur.short}m` }, { v: "long", label: `Rest ${dur.long}m` }]} value={mode} onChange={(v) => switchMode(v as typeof mode)} />
      </div>
      <div className="relative w-64 h-64 mx-auto">
        <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
          <circle cx="120" cy="120" r={R} fill="none" stroke="#1e2126" strokeWidth="10" />
          <circle cx="120" cy="120" r={R} fill="none" stroke={mode === "focus" ? "#cdff3d" : "#7dd3fc"} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - left / total)} className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono2 text-5xl font-bold tabular-nums">{pad(Math.floor(left / 60))}:{pad(left % 60)}</div>
          <div className="mt-1 text-[11px] font-mono2 uppercase tracking-[0.25em] text-fog">{mode === "focus" ? "deep work" : mode === "short" ? "breathe" : "walk around"}</div>
        </div>
      </div>
      <div className="flex justify-center gap-2.5">
        <Btn v="acid" onClick={toggle} className="w-40 !py-3.5">{running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> Start</>}</Btn>
        <Btn v="soft" onClick={() => switchMode(mode)} className="!py-3.5"><RotateCcw size={15} /></Btn>
      </div>
      <div className="flex justify-center gap-2">{Array.from({ length: 4 }).map((_, i) => <span key={i} className={cx("w-2.5 h-2.5 rounded-full", i < done % 4 || (done > 0 && done % 4 === 0) ? "bg-acid" : "bg-panel2 border border-line")} />)}</div>
      <Panel>
        <L>Customize (minutes)</L>
        <div className="grid grid-cols-3 gap-3">
          {(["focus", "short", "long"] as const).map((k) => (
            <div key={k}><L>{k}</L><Num value={String(dur[k])} onChange={(e) => { const v = Math.max(1, Math.min(90, +e.target.value || 25)); setDur({ ...dur, [k]: v }); if (mode === k && !running) setLeft(v * 60); }} className="text-center" /></div>
          ))}
        </div>
        <div className="pt-3"><Row k="Sessions completed" v={done} /></div>
      </Panel>
    </div>
  );
}

/* 5 ─ Time until (event countdown) */
function TimeUntil() {
  const def = new Date(Date.now() + 86400000 * 7);
  const [dt, setDt] = useState(def.toISOString().slice(0, 16));
  const [label, setLabel] = useState("My deadline");
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const target = new Date(dt).getTime();
  const ms = target - now;
  const past = ms < 0;
  const abs = Math.abs(ms);
  const parts = [Math.floor(abs / 86400000), Math.floor(abs / 3600000) % 24, Math.floor(abs / 60000) % 60, Math.floor(abs / 1000) % 60];
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><L>Event name</L><In value={label} onChange={(e) => setLabel(e.target.value)} /></div>
        <div><L>Date & time</L><In type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} /></div>
      </div>
      <Panel className="text-center !py-10">
        <div className="text-[11px] font-mono2 uppercase tracking-[0.25em] text-fog">{label} {past ? "was" : "is in"}</div>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-4">
          {([["days", parts[0]], ["hours", parts[1]], ["minutes", parts[2]], ["seconds", parts[3]]] as const).map(([lbl, v]) => (
            <div key={lbl}>
              <div className="font-mono2 text-4xl sm:text-6xl font-bold tabular-nums text-acid">{pad(v, v > 99 ? 3 : 2)}</div>
              <div className="mt-1 text-[10px] font-mono2 uppercase tracking-widest text-fog">{lbl}</div>
            </div>
          ))}
        </div>
        {past && <div className="mt-4 text-[12px] font-mono2 text-red-400">…ago. Pick a future date for a countdown.</div>}
      </Panel>
      <div className="flex flex-wrap gap-2">
        {([["New Year", `${new Date().getFullYear() + 1}-01-01T00:00`], ["In a week", new Date(Date.now() + 604800000).toISOString().slice(0, 16)], ["Tonight 8pm", (() => { const d = new Date(); d.setHours(20, 0, 0, 0); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:00`; })()]] as const).map(([n, v]) => (
          <Btn key={n} v="soft" className="!text-[12px]" onClick={() => { setDt(v); setLabel(n); }}>{n}</Btn>
        ))}
      </div>
    </div>
  );
}

/* 6 ─ Week number */
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
function WeekNo() {
  const [dt, setDt] = useState(new Date().toISOString().slice(0, 10));
  const d = dt ? new Date(dt + "T12:00:00") : new Date();
  const wk = isoWeek(d);
  const start = new Date(d.getFullYear(), 0, 1);
  const doy = Math.floor((d.getTime() - start.getTime()) / 86400000) + 1;
  const daysLeft = Math.floor((new Date(d.getFullYear(), 11, 31).getTime() - d.getTime()) / 86400000);
  return (
    <div className="space-y-5">
      <L>Pick a date</L>
      <In type="date" value={dt} onChange={(e) => setDt(e.target.value)} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-ink/60 border border-line rounded-xl px-4 py-3.5 col-span-2">
          <div className="text-[38px] font-bold font-mono2 tabular-nums text-acid leading-none">W{pad(wk)}</div>
          <div className="mt-1.5 text-[10.5px] font-mono2 uppercase tracking-[0.16em] text-fog">ISO week number</div>
        </div>
        <div className="bg-ink/60 border border-line rounded-xl px-4 py-3.5"><div className="text-[26px] font-bold font-mono2 text-cream leading-none pt-2">{doy}</div><div className="mt-1.5 text-[10.5px] font-mono2 uppercase tracking-[0.16em] text-fog">Day of year</div></div>
        <div className="bg-ink/60 border border-line rounded-xl px-4 py-3.5"><div className="text-[26px] font-bold font-mono2 text-cream leading-none pt-2">{daysLeft}</div><div className="mt-1.5 text-[10.5px] font-mono2 uppercase tracking-[0.16em] text-fog">Days left in {d.getFullYear()}</div></div>
      </div>
      <Panel>
        <Row k="Date" v={d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
        <Row k="Quarter" v={`Q${Math.floor(d.getMonth() / 3) + 1}`} />
        <Row k="Year progress" v={`${((doy / (new Date(d.getFullYear(), 1, 29).getDate() === 29 ? 366 : 365)) * 100).toFixed(1)}%`} />
      </Panel>
    </div>
  );
}

/* 7 ─ Business days */
function BizDays() {
  const [a, setA] = useState(new Date().toISOString().slice(0, 10));
  const [b, setB] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); });
  const [hol, setHol] = useState("");
  const r = useMemo(() => {
    const d1 = new Date(a), d2 = new Date(b);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    const holSet = new Set(hol.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean));
    const [lo, hi] = d1 < d2 ? [d1, d2] : [d2, d1];
    let biz = 0, weekend = 0, holsHit = new Set<string>();
    for (const d = new Date(lo); d <= hi; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const wd = d.getDay();
      if (wd === 0 || wd === 6) { weekend++; continue; }
      if (holSet.has(iso)) { holsHit.add(iso); continue; }
      biz++;
    }
    return { biz, weekend, hols: holsHit.size };
  }, [a, b, hol]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><L>From</L><In type="date" value={a} onChange={(e) => setA(e.target.value)} /></div>
        <div><L>To</L><In type="date" value={b} onChange={(e) => setB(e.target.value)} /></div>
      </div>
      <div><L hint="one per line, YYYY-MM-DD">Holidays to skip</L>
      <textarea value={hol} onChange={(e) => setHol(e.target.value)} placeholder={"2026-12-25\n2026-01-01"} className="w-full bg-panel2 border border-line rounded-xl px-4 py-3 font-mono2 text-[13px] min-h-20 outline-none focus:border-acid/60 text-cream" /></div>
      {r && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-ink/60 border border-line rounded-xl px-4 py-3.5"><div className="text-[26px] font-bold font-mono2 text-acid leading-none pt-1.5">{r.biz}</div><div className="mt-1.5 text-[10.5px] font-mono2 uppercase tracking-[0.16em] text-fog">Business days</div></div>
          <div className="bg-ink/60 border border-line rounded-xl px-4 py-3.5"><div className="text-[26px] font-bold font-mono2 text-cream leading-none pt-1.5">{r.weekend}</div><div className="mt-1.5 text-[10.5px] font-mono2 uppercase tracking-[0.16em] text-fog">Weekend days</div></div>
          <div className="bg-ink/60 border border-line rounded-xl px-4 py-3.5"><div className="text-[26px] font-bold font-mono2 text-cream leading-none pt-1.5">{r.hols}</div><div className="mt-1.5 text-[10.5px] font-mono2 uppercase tracking-[0.16em] text-fog">Holidays excluded</div></div>
        </div>
      )}
    </div>
  );
}

/* 8 ─ Timezone converter */
const ZONES = [["Local (you)", ""], ["New York", "America/New_York"], ["Chicago", "America/Chicago"], ["Los Angeles", "America/Los_Angeles"], ["UTC", "UTC"], ["London", "Europe/London"], ["Paris / Berlin", "Europe/Paris"], ["Moscow", "Europe/Moscow"], ["Dubai", "Asia/Dubai"], ["Mumbai", "Asia/Kolkata"], ["Bangkok", "Asia/Bangkok"], ["Singapore", "Asia/Singapore"], ["Tokyo", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"], ["Auckland", "Pacific/Auckland"]] as const;
function TzConvert() {
  const [dt, setDt] = useState(new Date().toISOString().slice(0, 16));
  const [from, setFrom] = useState("");
  const instant = useMemo(() => {
    if (!dt) return null;
    const [datePart, timePart] = dt.split("T");
    const [y, mo, d] = datePart.split("-").map(Number);
    const [h, mi] = timePart.split(":").map(Number);
    if (from === "") return new Date(y, mo - 1, d, h, mi);
    let guess = Date.UTC(y, mo - 1, d, h, mi);
    for (let i = 0; i < 3; i++) guess = Date.UTC(y, mo - 1, d, h, mi) - getOffset(from, new Date(guess));
    return new Date(guess);
  }, [dt, from]);
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><L>Date & time</L><In type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} /></div>
        <div><L>In timezone</L><Sel value={from} onChange={(e) => setFrom(e.target.value)}>{ZONES.filter((z) => z[0] !== "UTC" || true).map(([n, tz]) => <option key={n} value={tz}>{n}</option>)}</Sel></div>
      </div>
      {instant && (
        <Panel>
          {ZONES.filter(([, tz]) => tz !== from).map(([n, tz]) => (
            <Row key={n} k={n} v={tz === "" ? instant.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(instant)} />
          ))}
        </Panel>
      )}
    </div>
  );
}

export const timeTools: ToolDef[] = [
  { id: "stopwatch", name: "Stopwatch", desc: "Millisecond precision with laps and deltas.", category: "time", icon: Watch, keywords: ["timer", "lap timer", "measure time"], Component: Stopwatch },
  { id: "countdown-timer", name: "Countdown Timer", desc: "Set hours, minutes, seconds — visual progress with an alarm.", category: "time", icon: Hourglass, keywords: ["egg timer", "alarm", "timer online"], Component: Countdown },
  { id: "world-clock", name: "World Clock", desc: "Live times across the globe with day/night and offset hints.", category: "time", icon: Globe, keywords: ["time zones", "current time", "international time"], featured: true, Component: WorldClock },
  { id: "pomodoro-timer", name: "Pomodoro Timer", desc: "Focus blocks and breaks with a progress ring and gentle chime.", category: "time", icon: AlarmClock, keywords: ["focus timer", "25 minutes", "study timer", "deep work"], featured: true, Component: Pomodoro },
  { id: "countdown-to-date", name: "Countdown to Date", desc: "Live days/hours/minutes/seconds ticking to any event.", category: "time", icon: BellRing, keywords: ["days until", "event countdown", "how long until"], Component: TimeUntil },
  { id: "week-number", name: "Week Number", desc: "ISO week, day-of-year, quarter and year progress for any date.", category: "time", icon: Calendar, keywords: ["iso week", "what week is it", "day of year"], Component: WeekNo },
  { id: "business-days", name: "Business Days Calculator", desc: "Working days between dates, skipping weekends and holidays.", category: "time", icon: Briefcase, keywords: ["working days", "workdays between dates", "sla calculator"], Component: BizDays },
  { id: "timezone-converter", name: "Timezone Converter", desc: "Convert a moment from any zone into 14 others instantly.", category: "time", icon: Clock, keywords: ["time zone conversion", "meeting planner", "utc offset"], Component: TzConvert },
];
