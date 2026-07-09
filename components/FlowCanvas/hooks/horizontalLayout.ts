import { RUENode } from "../types";
import { NODE_W, estimateNodeHeight } from "./types";

// Base gaps — will scale up when nodes are tall/wide
const BASE_H_GAP = 80;
const BASE_V_GAP = 40;

export function applyhorizontalLayout(
  nodes: RUENode[],
  domHeights: Map<string, number>
): RUENode[] {
  const laid = nodes.map((n) => ({ ...n }));

  const getH = (n: RUENode) => domHeights.get(n.id) ?? estimateNodeHeight(n);
  const getW = (n: RUENode) => NODE_W[n.type] ?? 260;

  // ── Dynamic gap helpers ────────────────────────────────────────────────────
  // hGap: extra horizontal breathing room scales with parent width
  const hGap = (n: RUENode) => BASE_H_GAP + Math.max(0, getW(n) - 200) * 0.3;

  // vGap between two siblings scales with the taller of the two
  const vGap = (a: RUENode, b: RUENode) =>
    BASE_V_GAP + Math.max(getH(a), getH(b)) * 0.35;

  // ── Build tree ─────────────────────────────────────────────────────────────
  const childrenOf = new Map<string, RUENode[]>();
  laid.forEach((n) => {
    const pid = n.parent || "__root__";
    if (!childrenOf.has(pid)) childrenOf.set(pid, []);
    childrenOf.get(pid)!.push(n);
  });

  const roots = childrenOf.get("__root__") ?? [];

  // ── Subtree height: sum of child heights + dynamic gaps between them ───────
  const heightCache = new Map<string, number>();

  function calcSubtreeHeight(n: RUENode): number {
    const kids = childrenOf.get(n.id) ?? [];
    if (!kids.length) {
      heightCache.set(n.id, getH(n));
      return getH(n);
    }

    let sum = 0;
    kids.forEach((k) => { sum += calcSubtreeHeight(k); });

    // Add dynamic gap between each pair of siblings
    for (let i = 0; i < kids.length - 1; i++) {
      sum += vGap(kids[i], kids[i + 1]);
    }

    const h = Math.max(getH(n), sum);
    heightCache.set(n.id, h);
    return h;
  }

  // ── Position nodes ─────────────────────────────────────────────────────────
  function position(n: RUENode, x: number, y: number, allocH: number) {
    const nodeH = getH(n);
    n.x = x;
    n.y = y + (allocH - nodeH) / 2;

    const kids = childrenOf.get(n.id) ?? [];
    if (!kids.length) return;

    const childX = x + getW(n) + hGap(n);
    let curY = y;

    kids.forEach((kid, i) => {
      const kh = heightCache.get(kid.id) ?? getH(kid);
      position(kid, childX, curY, kh);
      curY += kh;
      // Add dynamic gap before next sibling
      if (i < kids.length - 1) {
        curY += vGap(kid, kids[i + 1]);
      }
    });
  }

  roots.forEach((r) => calcSubtreeHeight(r));

  let startY = 120;
  roots.forEach((root) => {
    const rh = heightCache.get(root.id) ?? getH(root);
    position(root, 160, startY, rh);
    startY += rh + 140;
  });

  return laid;
}