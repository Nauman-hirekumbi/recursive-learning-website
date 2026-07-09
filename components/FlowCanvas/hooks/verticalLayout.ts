import { RUENode } from "../types";
import { NODE_W, estimateNodeHeight } from "./types";

// Base gaps — will scale up when nodes are tall/wide
const BASE_V_GAP = 160;
const BASE_H_GAP = 40;

export function applyVerticalLayout(
  nodes: RUENode[],
  domHeights: Map<string, number>
): RUENode[] {
  const laid = nodes.map((n) => ({ ...n }));

  const getH = (n: RUENode) => domHeights.get(n.id) ?? estimateNodeHeight(n);
  const getW = (n: RUENode) => NODE_W[n.type] ?? 260;

  // ── Dynamic gap helpers ────────────────────────────────────────────────────
  // vGap: extra vertical breathing room scales with parent height
  const vGap = (n: RUENode) => BASE_V_GAP + Math.max(0, getH(n) - 80) * 0.5;

  // hGap between two siblings scales with the wider of the two
  const hGap = (a: RUENode, b: RUENode) =>
    BASE_H_GAP + Math.max(getW(a), getW(b)) * 0.25;

  // ── Build tree ─────────────────────────────────────────────────────────────
  const childrenOf = new Map<string, RUENode[]>();
  laid.forEach((n) => {
    const pid = n.parent || "__root__";
    if (!childrenOf.has(pid)) childrenOf.set(pid, []);
    childrenOf.get(pid)!.push(n);
  });

  const roots = childrenOf.get("__root__") ?? [];

  // ── Subtree width: sum of child widths + dynamic gaps between them ─────────
  const widthCache = new Map<string, number>();

  function calcSubtreeWidth(n: RUENode): number {
    const kids = childrenOf.get(n.id) ?? [];

    if (!kids.length) {
      const w = getW(n);
      widthCache.set(n.id, w);
      return w;
    }

    let total = 0;
    kids.forEach((k) => { total += calcSubtreeWidth(k); });

    // Add dynamic gap between each pair of siblings
    for (let i = 0; i < kids.length - 1; i++) {
      total += hGap(kids[i], kids[i + 1]);
    }

    const w = Math.max(getW(n), total);
    widthCache.set(n.id, w);
    return w;
  }

  // ── Position nodes ─────────────────────────────────────────────────────────
  function layout(n: RUENode, x: number, y: number) {
    const nodeW = getW(n);
    const nodeH = getH(n);
    const subtreeW = widthCache.get(n.id)!;

    // Center node inside its allocated subtree width
    n.x = x + (subtreeW - nodeW) / 2;
    n.y = y;

    const kids = childrenOf.get(n.id) ?? [];
    if (!kids.length) return;

    let currentX = x;

    kids.forEach((kid, i) => {
      const kidW = widthCache.get(kid.id)!;

      layout(kid, currentX, y + nodeH + vGap(n));

      currentX += kidW;
      // Add dynamic gap before next sibling
      if (i < kids.length - 1) {
        currentX += hGap(kid, kids[i + 1]);
      }
    });
  }

  // ── Run ────────────────────────────────────────────────────────────────────
  roots.forEach((r) => calcSubtreeWidth(r));

  let startX = 200;
  roots.forEach((root) => {
    const w = widthCache.get(root.id)!;
    layout(root, startX, 120);
    startX += w + 200;
  });

  return laid;
}