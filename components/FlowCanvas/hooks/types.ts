import { RUENode } from "../types";

export type LayoutDirection = "vertical" | "horizontal";

export interface LayoutOptions {
  direction: LayoutDirection;
}

export const NODE_W: Record<string, number> = {
  main: 260,
  keyword: 200,
  sub: 260,
  note: 220,
  text: 140,
};

export function estimateNodeHeight(node: RUENode): number {
  if (node.type === "text") return 48;
  if (node.type === "keyword") return 60;

  const w = NODE_W[node.type] ?? 260;
  const label = node.label ?? "";
  const charsPerLine = Math.max(1, Math.floor((w - 32) / 7));
  const textLines = Math.max(1, Math.ceil(label.length / charsPerLine));
  const textH = textLines * 22;

  const headerH = 40;

  // ── Only count chips that haven't been used yet ───────────────────────────
  const keywords = (node as any).keywords ?? [];
  const usedKeywords: string[] = (node as any).usedKeywords ?? [];
  const remainingChips = keywords.filter((kw: string) => !usedKeywords.includes(kw));

  const badgeH =
    remainingChips.length > 0
      ? Math.ceil(remainingChips.length / 2) * 36 + 12
      : 0;

  return headerH + textH + badgeH + 40;
}