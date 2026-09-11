import { Type, Calculator, ArrowRightLeft, Files, Sparkles, Code, Palette, Clock, Coffee } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CatId, ToolDef } from "../lib/types";
import { textTools } from "./textTools";
import { calcTools } from "./calcTools";
import { convertTools } from "./convertTools";
import { fileImageTools } from "./fileImageTools";
import { filePdfTools } from "./filePdfTools";
import { fileDocTools } from "./fileDocTools";
import { genTools } from "./genTools";
import { devTools } from "./devTools";
import { colorTools } from "./colorTools";
import { timeTools } from "./timeTools";
import { miscTools } from "./miscTools";

export const CATEGORIES: { id: CatId; label: string; icon: LucideIcon; blurb: string }[] = [
  { id: "text", label: "Text", icon: Type, blurb: "Count, convert, clean & compare" },
  { id: "calc", label: "Calculators", icon: Calculator, blurb: "Numbers that answer back" },
  { id: "convert", label: "Converters", icon: ArrowRightLeft, blurb: "Units into other units" },
  { id: "file", label: "File Converters", icon: Files, blurb: "PDF, images, docs & ebooks" },
  { id: "generate", label: "Generators", icon: Sparkles, blurb: "Passwords, QR, UUIDs, data" },
  { id: "dev", label: "Developer", icon: Code, blurb: "JSON, regex, cron, tokens" },
  { id: "color", label: "Color", icon: Palette, blurb: "Convert, mix, check contrast" },
  { id: "time", label: "Time", icon: Clock, blurb: "Timers, clocks & calendars" },
  { id: "everyday", label: "Everyday", icon: Coffee, blurb: "Speech, dice & life choices" },
];

export const TOOLS: ToolDef[] = [
  ...textTools, ...calcTools, ...convertTools,
  ...fileImageTools, ...filePdfTools, ...fileDocTools,
  ...genTools, ...devTools, ...colorTools, ...timeTools, ...miscTools,
];

export const catOf = (id: CatId) => CATEGORIES.find((c) => c.id === id)!;

export function searchTools(q: string, pool: ToolDef[] = TOOLS): ToolDef[] {
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return pool;
  return pool
    .map((t) => {
      const hay = `${t.name} ${t.desc} ${t.keywords.join(" ")} ${catOf(t.category).label}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (t.name.toLowerCase().startsWith(term)) score += 4;
        else if (t.name.toLowerCase().includes(term)) score += 3;
        else if (t.keywords.some((k) => k.includes(term))) score += 2;
        else if (hay.includes(term)) score += 1;
        else return null;
      }
      return { t, score };
    })
    .filter((x): x is { t: ToolDef; score: number } => x !== null)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}
