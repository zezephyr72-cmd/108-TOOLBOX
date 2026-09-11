import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type CatId = "text" | "calc" | "convert" | "file" | "generate" | "dev" | "color" | "time" | "everyday";

export interface ToolDef {
  id: string;
  name: string;
  desc: string;
  category: CatId;
  icon: LucideIcon;
  keywords: string[];
  featured?: boolean;
  /** how the tool handles user data — drives the privacy note in the UI */
  processing?: "client" | "server";
  /** explicit cross-links shown in related tools (fills with same-category tools) */
  related?: string[];
  /** registered & searchable, but not yet functional */
  soon?: boolean;
  Component: ComponentType;
}
