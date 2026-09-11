/* ── 12 Calculators ────────────────────────────────────────────── */
import { useMemo, useState } from "react";
import { Percent, Receipt, Scale, Cake, Landmark, TrendingUp, Tag, GraduationCap, CalendarDays, Fuel, Frame, ShoppingCart, Plus, Trash2 } from "lucide-react";
import type { ToolDef } from "../lib/types";
import { Btn, In, L, Num, Panel, Row, Seg, Sel, Stat, gcd, fmt } from "../lib/ui";

/* 1 ─ Percentage */
function Percentage() {
  const [mode, setMode] = useState<"of" | "what" | "change">("of");
  const [x, setX] = useState("25");
  const [y, setY] = useState("200");
  const a = parseFloat(x) || 0, b = parseFloat(y) || 0;
  const res = mode === "of" ? (a / 100) * b : mode === "what" ? (b ? (a / b) * 100 : 0) : (a !== 0 ? ((b - a) / Math.abs(a)) * 100 : 0);
  const label = mode === "of" ? `${a}% of ${b}` : mode === "what" ? `${a} as % of ${b}` : `change from ${a} to ${b}`;
  return (
    <div className="space-y-5">
      <Seg options={[{ v: "of", label: "X% of Y" }, { v: "what", label: "X is what % of Y" }, { v: "change", label: "% change" }]} value={mode} onChange={setMode} />
      <div className="grid grid-cols-2 gap-3">
        <div><L>{mode === "of" ? "Percentage (%)" : "Value X"}</L><Num value={x} onChange={(e) => setX(e.target.value)} /></div>
        <div><L>{mode === "of" ? "Of value" : mode === "what" ? "Of value Y" : "New value"}</L><Num value={y} onChange={(e) => setY(e.target.value)} /></div>
      </div>
      <Panel className="text-center !py-8">
        <div className="text-[11px] font-mono2 uppercase tracking-[0.2em] text-fog">{label}</div>
        <div className="mt-2 text-5xl font-bold font-mono2 tabular-nums text-acid">{fmt(res, 4)}{mode !== "of" ? "%" : ""}</div>
      </Panel>
    </div>
  );
}

/* 2 ─ Tip */
function Tip() {
  const [bill, setBill] = useState("86.40");
  const [tip, setTip] = useState(18);
  const [custom, setCustom] = useState("");
  const [people, setPeople] = useState(2);
  const [cur, setCur] = useState("$");
  const pct = custom ? parseFloat(custom) || 0 : tip;
  const b = parseFloat(bill) || 0;
  const tipAmt = (b * pct) / 100, total = b + tipAmt;
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-[1fr_120px] gap-3">
        <div><L>Bill amount</L><Num value={bill} onChange={(e) => setBill(e.target.value)} /></div>
        <div><L>Currency</L><Sel value={cur} onChange={(e) => setCur(e.target.value)}>{["$", "€", "£", "₹", "¥"].map((c) => <option key={c}>{c}</option>)}</Sel></div>
      </div>
      <div>
        <L>Tip — {pct}%</L>
        <div className="flex flex-wrap gap-2">
          {[10, 15, 18, 20, 25].map((p) => (
            <Btn key={p} v={!custom && tip === p ? "acid" : "soft"} onClick={() => { setTip(p); setCustom(""); }}>{p}%</Btn>
          ))}
          <In value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Custom %" className="!w-28" />
        </div>
      </div>
      <div>
        <L hint={`${people} ${people === 1 ? "person" : "people"}`}>Split between</L>
        <input type="range" className="slider" min={1} max={16} value={people} onChange={(e) => setPeople(+e.target.value)} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Tip" value={`${cur}${fmt(tipAmt)}`} /><Stat label="Total" value={`${cur}${fmt(total)}`} />
        <Stat label="Tip / person" value={`${cur}${fmt(tipAmt / people)}`} /><Stat label="Each pays" value={`${cur}${fmt(total / people)}`} accent />
      </div>
    </div>
  );
}

/* 3 ─ BMI */
function BMI() {
  const [unit, setUnit] = useState<"m" | "i">("m");
  const [cm, setCm] = useState("175");
  const [kg, setKg] = useState("70");
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("9");
  const [lb, setLb] = useState("154");
  const hM = unit === "m" ? (parseFloat(cm) || 0) / 100 : ((parseFloat(ft) || 0) * 12 + (parseFloat(inch) || 0)) * 0.0254;
  const wKg = unit === "m" ? parseFloat(kg) || 0 : (parseFloat(lb) || 0) * 0.453592;
  const bmi = hM > 0 ? wKg / (hM * hM) : 0;
  const cat = bmi < 18.5 ? ["Underweight", "#7dd3fc"] : bmi < 25 ? ["Healthy", "#cdff3d"] : bmi < 30 ? ["Overweight", "#fbbf24"] : ["Obese", "#f87171"];
  const pos = Math.min(100, Math.max(0, ((bmi - 14) / 26) * 100));
  return (
    <div className="space-y-5">
      <Seg options={[{ v: "m", label: "Metric" }, { v: "i", label: "Imperial" }]} value={unit} onChange={setUnit} />
      {unit === "m" ? (
        <div className="grid grid-cols-2 gap-3">
          <div><L>Height (cm)</L><Num value={cm} onChange={(e) => setCm(e.target.value)} /></div>
          <div><L>Weight (kg)</L><Num value={kg} onChange={(e) => setKg(e.target.value)} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div><L>Feet</L><Num value={ft} onChange={(e) => setFt(e.target.value)} /></div>
          <div><L>Inches</L><Num value={inch} onChange={(e) => setInch(e.target.value)} /></div>
          <div><L>Pounds</L><Num value={lb} onChange={(e) => setLb(e.target.value)} /></div>
        </div>
      )}
      {bmi > 0 && bmi < 200 && (
        <Panel>
          <div className="flex items-end justify-between">
            <div className="text-5xl font-bold font-mono2 tabular-nums" style={{ color: cat[1] }}>{bmi.toFixed(1)}</div>
            <div className="text-sm font-semibold" style={{ color: cat[1] }}>{cat[0]}</div>
          </div>
          <div className="mt-5 relative h-3 rounded-full" style={{ background: "linear-gradient(90deg,#7dd3fc 0%,#7dd3fc 17%,#cdff3d 17%,#cdff3d 42%,#fbbf24 42%,#fbbf24 62%,#f87171 62%)" }}>
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-cream border-4 border-ink shadow" style={{ left: `${pos}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-mono2 text-fog"><span>14</span><span>18.5</span><span>25</span><span>30</span><span>40</span></div>
          <p className="mt-4 text-[12.5px] text-fog">Healthy range for your height: <span className="text-cream font-mono2">{fmt(18.5 * hM * hM, 1)} – {fmt(24.9 * hM * hM, 1)} {unit === "m" ? "kg" : "lb"}</span></p>
        </Panel>
      )}
    </div>
  );
}

/* 4 ─ Age */
function Age() {
  const [dob, setDob] = useState("1995-06-15");
  const r = useMemo(() => {
    if (!dob) return null;
    const b = new Date(dob + "T00:00:00"), now = new Date();
    if (isNaN(b.getTime()) || b > now) return null;
    let y = now.getFullYear() - b.getFullYear(), m = now.getMonth() - b.getMonth(), d = now.getDate() - b.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    const days = Math.floor((now.getTime() - b.getTime()) / 86400000);
    let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    if (next <= new Date(now.getFullYear(), now.getMonth(), now.getDate())) next = new Date(now.getFullYear() + 1, b.getMonth(), b.getDate());
    return { y, m, d, days, next: Math.round((next.getTime() - now.getTime()) / 86400000), wd: b.toLocaleDateString("en-US", { weekday: "long" }) };
  }, [dob]);
  return (
    <div className="space-y-5">
      <L>Date of birth</L>
      <In type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
      {r && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Years" value={r.y} accent /><Stat label="Months" value={r.m} /><Stat label="Days" value={r.d} />
          </div>
          <Panel>
            <Row k="Total days alive" v={fmt(r.days, 0)} />
            <Row k="Total weeks" v={fmt(Math.floor(r.days / 7), 0)} />
            <Row k="Born on a" v={r.wd} mono={false} />
            <Row k="Next birthday" v={`in ${r.next} days`} />
          </Panel>
        </>
      )}
    </div>
  );
}

/* 5 ─ Loan / EMI */
function Loan() {
  const [p, setP] = useState("250000");
  const [r, setR] = useState("6.5");
  const [yrs, setYrs] = useState("20");
  const P = parseFloat(p) || 0, i = (parseFloat(r) || 0) / 1200, n = (parseFloat(yrs) || 0) * 12;
  const emi = i > 0 && n > 0 ? (P * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1) : n > 0 ? P / n : 0;
  const total = emi * n, interest = total - P;
  const pct = total > 0 ? (P / total) * 100 : 50;
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        <div><L>Loan amount</L><Num value={p} onChange={(e) => setP(e.target.value)} /></div>
        <div><L>Interest rate % / yr</L><Num value={r} onChange={(e) => setR(e.target.value)} /></div>
        <div><L>Term (years)</L><Num value={yrs} onChange={(e) => setYrs(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Monthly payment" value={fmt(emi)} accent /><Stat label="Total interest" value={fmt(Math.max(0, interest))} /><Stat label="Total paid" value={fmt(total)} />
      </div>
      {total > 0 && (
        <Panel>
          <div className="flex h-4 rounded-full overflow-hidden">
            <div className="bg-acid transition-all duration-500" style={{ width: `${pct}%` }} />
            <div className="bg-red-400/70 flex-1" />
          </div>
          <div className="mt-3 flex justify-between text-[11.5px] font-mono2 text-fog">
            <span className="text-acid">■ principal {pct.toFixed(0)}%</span><span className="text-red-300">■ interest {(100 - pct).toFixed(0)}%</span>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* 6 ─ Compound interest */
function Compound() {
  const [p, setP] = useState("10000");
  const [r, setR] = useState("8");
  const [yrs, setYrs] = useState("10");
  const [m, setM] = useState("200");
  const rows = useMemo(() => {
    let bal = parseFloat(p) || 0;
    const rate = (parseFloat(r) || 0) / 1200, pmt = parseFloat(m) || 0, years = Math.min(50, parseInt(yrs) || 0);
    const out: { y: number; bal: number; invested: number }[] = [];
    let invested = bal;
    for (let y = 1; y <= years; y++) {
      for (let mo = 0; mo < 12; mo++) { bal = bal * (1 + rate) + pmt; invested += pmt; }
      out.push({ y, bal, invested });
    }
    return out;
  }, [p, r, yrs, m]);
  const last = rows[rows.length - 1];
  const max = last ? last.bal : 1;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><L>Initial</L><Num value={p} onChange={(e) => setP(e.target.value)} /></div>
        <div><L>Rate % / yr</L><Num value={r} onChange={(e) => setR(e.target.value)} /></div>
        <div><L>Years</L><Num value={yrs} onChange={(e) => setYrs(e.target.value)} /></div>
        <div><L>Monthly add</L><Num value={m} onChange={(e) => setM(e.target.value)} /></div>
      </div>
      {last && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Final balance" value={fmt(last.bal)} accent />
            <Stat label="You put in" value={fmt(last.invested)} />
            <Stat label="Interest earned" value={fmt(last.bal - last.invested)} />
          </div>
          <Panel className="!p-4">
            <div className="flex items-end gap-[3px] h-32">
              {rows.map((r2) => (
                <div key={r2.y} className="flex-1 flex flex-col justify-end gap-0 group relative" title={`Year ${r2.y}: ${fmt(r2.bal)}`}>
                  <div className="bg-acid/90 rounded-t-sm transition-all" style={{ height: `${(r2.bal / max) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-mono2 text-fog"><span>yr 1</span><span>yr {rows.length}</span></div>
          </Panel>
        </>
      )}
    </div>
  );
}

/* 7 ─ Discount */
function Discount() {
  const [price, setPrice] = useState("129.99");
  const [off, setOff] = useState(20);
  const [tax, setTax] = useState("0");
  const p = parseFloat(price) || 0, t = parseFloat(tax) || 0;
  const after = p * (1 - off / 100), final = after * (1 + t / 100);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div><L>Original price</L><Num value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div><L>Sales tax %</L><Num value={tax} onChange={(e) => setTax(e.target.value)} placeholder="0" /></div>
      </div>
      <div>
        <L>Discount — {off}% off</L>
        <input type="range" className="slider" min={0} max={95} value={off} onChange={(e) => setOff(+e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          {[10, 15, 20, 25, 30, 40, 50, 70].map((p2) => <Btn key={p2} v={off === p2 ? "acid" : "soft"} onClick={() => setOff(p2)} className="!py-1.5 !text-[12px]">{p2}%</Btn>)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="You pay" value={fmt(final)} accent /><Stat label="You save" value={fmt(p - after)} /><Stat label="Discount" value={`${off}%`} />
      </div>
    </div>
  );
}

/* 8 ─ GPA */
const GRADES: [string, number][] = [["A", 4], ["A-", 3.7], ["B+", 3.3], ["B", 3], ["B-", 2.7], ["C+", 2.3], ["C", 2], ["C-", 1.7], ["D+", 1.3], ["D", 1], ["F", 0]];
function GPA() {
  const [rows, setRows] = useState([{ c: "3", g: 4 }, { c: "4", g: 3.3 }, { c: "3", g: 3.7 }]);
  const totC = rows.reduce((s, r) => s + (parseFloat(r.c) || 0), 0);
  const gpa = totC ? rows.reduce((s, r) => s + (parseFloat(r.c) || 0) * r.g, 0) / totC : 0;
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <Num value={r.c} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, c: e.target.value } : x)))} placeholder="Credits" />
            <Sel value={r.g} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, g: +e.target.value } : x)))}>
              {GRADES.map(([g, v]) => <option key={g} value={v}>{g} ({v})</option>)}
            </Sel>
            <Btn v="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="!px-3"><Trash2 size={14} /></Btn>
          </div>
        ))}
      </div>
      <Btn v="soft" onClick={() => setRows([...rows, { c: "3", g: 4 }])}><Plus size={14} /> Add course</Btn>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="GPA" value={gpa.toFixed(2)} accent /><Stat label="Total credits" value={fmt(totC, 1)} /><Stat label="Courses" value={rows.length} />
      </div>
    </div>
  );
}

/* 9 ─ Date difference */
function DateDiff() {
  const [a, setA] = useState(new Date().toISOString().slice(0, 10));
  const [b, setB] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().slice(0, 10); });
  const r = useMemo(() => {
    const d1 = new Date(a), d2 = new Date(b);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    const ms = Math.abs(d2.getTime() - d1.getTime()), days = Math.round(ms / 86400000);
    let biz = 0;
    const step = d1 < d2 ? 1 : -1;
    for (let d = new Date(d1); step > 0 ? d < d2 : d > d2; d.setDate(d.getDate() + step)) {
      const wd = d.getDay();
      if (step > 0 && wd !== 0 && wd !== 6) biz++;
      if (step < 0 && wd !== 0 && wd !== 6) biz++;
    }
    return { days, weeks: Math.floor(days / 7), rd: days % 7, months: (days / 30.4375).toFixed(1), biz };
  }, [a, b]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div><L>Start date</L><In type="date" value={a} onChange={(e) => setA(e.target.value)} /></div>
        <div><L>End date</L><In type="date" value={b} onChange={(e) => setB(e.target.value)} /></div>
      </div>
      {r && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Days" value={fmt(r.days, 0)} accent /><Stat label="Weeks" value={`${r.weeks}w ${r.rd}d`} /><Stat label="Months ≈" value={r.months} />
          </div>
          <Panel><Row k="Business days (Mon–Fri)" v={fmt(r.biz, 0)} /><Row k="Weekend days" v={fmt(r.days - r.biz, 0)} /></Panel>
        </>
      )}
    </div>
  );
}

/* 10 ─ Fuel cost */
function FuelCost() {
  const [unit, setUnit] = useState<"m" | "i">("m");
  const [dist, setDist] = useState("450");
  const [eff, setEff] = useState("7.5");
  const [price, setPrice] = useState("1.65");
  const d = parseFloat(dist) || 0, e = parseFloat(eff) || 0.0001, p = parseFloat(price) || 0;
  const litres = unit === "m" ? (d * e) / 100 : d / e;
  const used = unit === "m" ? litres : litres;
  const cost = used * p;
  return (
    <div className="space-y-5">
      <Seg options={[{ v: "m", label: "Metric (L/100km)" }, { v: "i", label: "Imperial (MPG)" }]} value={unit} onChange={setUnit} />
      <div className="grid sm:grid-cols-3 gap-3">
        <div><L>Distance ({unit === "m" ? "km" : "miles"})</L><Num value={dist} onChange={(e) => setDist(e.target.value)} /></div>
        <div><L>Efficiency ({unit === "m" ? "L/100km" : "mpg"})</L><Num value={eff} onChange={(e) => setEff(e.target.value)} /></div>
        <div><L>Fuel price / {unit === "m" ? "litre" : "gallon"}</L><Num value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label={`Fuel needed (${unit === "m" ? "L" : "gal"})`} value={fmt(used, 1)} />
        <Stat label="Trip cost" value={fmt(cost)} accent />
      </div>
    </div>
  );
}

/* 11 ─ Aspect ratio */
const RATIOS: [number, number][] = [[16, 9], [16, 10], [4, 3], [3, 2], [1, 1], [21, 9], [9, 16], [5, 4]];
function Aspect() {
  const [w, setW] = useState("1920");
  const [h, setH] = useState("1080");
  const [base, setBase] = useState<[number, number]>([16, 9]);
  const [nw, setNw] = useState("1280");
  const W = parseFloat(w) || 0, H = parseFloat(h) || 0;
  const g = W && H ? gcd(Math.round(W), Math.round(H)) : 1;
  const nh = (parseFloat(nw) || 0) * (base[1] / base[0]);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div><L>Width</L><Num value={w} onChange={(e) => setW(e.target.value)} /></div>
        <div><L>Height</L><Num value={h} onChange={(e) => setH(e.target.value)} /></div>
      </div>
      {W > 0 && H > 0 && (
        <Panel className="text-center !py-7">
          <div className="text-4xl font-bold font-mono2 text-acid">{Math.round(W) / g} : {Math.round(H) / g}</div>
          <div className="mt-1.5 text-[12px] font-mono2 text-fog">decimal ratio {(W / H).toFixed(4)}</div>
        </Panel>
      )}
      <div>
        <L>Scale a dimension</L>
        <div className="flex flex-wrap gap-2 mb-3">
          {RATIOS.map((r) => (
            <Btn key={r.join(":")} v={base[0] === r[0] && base[1] === r[1] ? "acid" : "soft"} onClick={() => setBase(r)} className="!py-1.5 !text-[12px] font-mono2">{r[0]}:{r[1]}</Btn>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div><L>If width is</L><Num value={nw} onChange={(e) => setNw(e.target.value)} /></div>
          <Panel className="text-center !py-3"><span className="text-[11px] font-mono2 text-fog">height = </span><span className="font-mono2 text-acid text-lg font-bold">{fmt(nh, 1)}</span></Panel>
        </div>
      </div>
    </div>
  );
}

/* 12 ─ Unit price */
const UNITS: [string, number][] = [["g", 1], ["kg", 1000], ["ml", 1], ["L", 1000], ["oz", 28.35], ["lb", 453.59], ["pcs", 1]];
function UnitPrice() {
  const [items, setItems] = useState([{ p: "4.29", q: "500", u: 1 }, { p: "7.99", q: "1", u: 1000 }, { p: "", q: "", u: 1 }]);
  const calc = items.map((it) => {
    const price = parseFloat(it.p) || 0, base = (parseFloat(it.q) || 0) * it.u;
    return price > 0 && base > 0 ? price / base : null;
  });
  const valid = calc.filter((x): x is number => x !== null);
  const best = valid.length ? Math.min(...valid) : null;
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <div key={i} className={`grid grid-cols-[1fr_1fr_90px] gap-2 p-3 rounded-xl border ${calc[i] !== null && calc[i] === best ? "border-acid/60 bg-acid/5" : "border-line bg-panel2"}`}>
            <Num value={it.p} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, p: e.target.value } : x)))} placeholder={`Price ${i + 1}`} />
            <Num value={it.q} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))} placeholder="Quantity" />
            <Sel value={it.u} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, u: +e.target.value } : x)))}>
              {UNITS.map(([n, v]) => <option key={n} value={v}>{n}</option>)}
            </Sel>
          </div>
        ))}
      </div>
      {items.length < 4 && <Btn v="soft" onClick={() => setItems([...items, { p: "", q: "", u: 1 }])}><Plus size={14} /> Add product</Btn>}
      {valid.length > 0 && (
        <Panel>
          {items.map((it, i) => {
            const unitName = UNITS.find((u) => u[1] === it.u)![0];
            const isPiece = unitName === "pcs";
            const perBase = calc[i];
            if (perBase === null) return null;
            const isBest = perBase === best && valid.length > 1;
            const display = isPiece ? `${fmt(perBase, 3)} / pc` : `${fmt(perBase * 100, 3)} / 100 ${unitName === "ml" || unitName === "L" ? "ml" : "g"}`;
            return (
              <div key={i} className={`flex items-center justify-between py-2.5 border-b border-line last:border-0 ${isBest ? "text-acid" : ""}`}>
                <span className="text-[13px] font-semibold">Option {i + 1}{isBest ? " — best deal ✓" : ""}</span>
                <span className="font-mono2 text-[13.5px] tabular-nums">{display}</span>
              </div>
            );
          })}
        </Panel>
      )}
    </div>
  );
}

export const calcTools: ToolDef[] = [
  { id: "percentage-calculator", name: "Percentage Calculator", desc: "Find X% of Y, what percent X is of Y, and percent change.", category: "calc", icon: Percent, keywords: ["percent", "percentage of", "increase decrease"], featured: true, Component: Percentage },
  { id: "tip-calculator", name: "Tip Calculator", desc: "Split the bill and tip fairly between any group size.", category: "calc", icon: Receipt, keywords: ["gratuity", "split bill", "restaurant"], Component: Tip },
  { id: "bmi-calculator", name: "BMI Calculator", desc: "Body mass index with a visual scale and healthy weight range.", category: "calc", icon: Scale, keywords: ["body mass index", "weight health", "ideal weight"], featured: true, Component: BMI },
  { id: "age-calculator", name: "Age Calculator", desc: "Exact age in years, months and days — plus days until your next birthday.", category: "calc", icon: Cake, keywords: ["how old am i", "birthday", "date of birth"], Component: Age },
  { id: "loan-calculator", name: "Loan / EMI Calculator", desc: "Monthly payment, total interest and payoff breakdown for any loan.", category: "calc", icon: Landmark, keywords: ["mortgage", "emi", "monthly payment", "interest"], Component: Loan },
  { id: "compound-interest", name: "Compound Interest", desc: "Watch money grow with monthly contributions and year-by-year charts.", category: "calc", icon: TrendingUp, keywords: ["investment growth", "savings", "future value", "apy"], Component: Compound },
  { id: "discount-calculator", name: "Discount Calculator", desc: "Sale price after any percentage off, with optional sales tax.", category: "calc", icon: Tag, keywords: ["sale price", "percent off", "coupon", "price drop"], Component: Discount },
  { id: "gpa-calculator", name: "GPA Calculator", desc: "Weighted grade point average across all your courses.", category: "calc", icon: GraduationCap, keywords: ["grades", "college", "4.0 scale", "semester"], Component: GPA },
  { id: "date-difference", name: "Date Difference", desc: "Days, weeks, months and business days between two dates.", category: "calc", icon: CalendarDays, keywords: ["days between dates", "how many days", "countdown days"], Component: DateDiff },
  { id: "fuel-cost", name: "Fuel Cost Calculator", desc: "Trip fuel spend from distance, efficiency and pump price.", category: "calc", icon: Fuel, keywords: ["gas cost", "trip cost", "mpg", "petrol"], Component: FuelCost },
  { id: "aspect-ratio", name: "Aspect Ratio Calculator", desc: "Simplify any ratio and scale dimensions without distortion.", category: "calc", icon: Frame, keywords: ["16:9", "resolution", "resize image", "ratio"], Component: Aspect },
  { id: "unit-price", name: "Unit Price Comparator", desc: "Compare products by price per 100g / L / unit to find the real deal.", category: "calc", icon: ShoppingCart, keywords: ["best deal", "price per gram", "grocery compare", "cost per unit"], Component: UnitPrice },
];
