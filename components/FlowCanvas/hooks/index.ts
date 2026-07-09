import { RUENode } from "../types";
import { LayoutDirection } from "./types";
import { applyVerticalLayout } from "./verticalLayout";
import { applyhorizontalLayout } from "./horizontalLayout";

export type { LayoutDirection } from "./types";
export { NODE_W, estimateNodeHeight } from "./types";

// 🔥 ADD THIS FUNCTION HERE
function attachParentsFromEdges(
  nodes: RUENode[],
  edges: { source: string; target: string }[]
): RUENode[] {
  const parentMap = new Map<string, string>();

  edges.forEach((e) => {
    parentMap.set(e.target, e.source);
  });

  return nodes.map((n) => ({
    ...n,
    parent: parentMap.get(n.id),
  }));
}

// Only these node types belong to the AI-generated concept tree and should
// ever be auto-arranged by the layout algorithms below. "text" and "note"
// nodes are free-floating — the user places them by hand — and have no
// `parent` edge, so without this filter they were treated as extra tree
// roots and silently snapped back into the stacked tree layout every time
// *any* node changed anywhere on the canvas (e.g. typing in a chat answer).
// That made manually-positioned text boxes / sticky notes impossible to
// keep in place.
const TREE_NODE_TYPES = new Set(["main", "keyword", "sub"]);

export function layoutTree(
  nodes: RUENode[],
  domHeights: Map<string, number> = new Map(),
  options: { direction?: LayoutDirection; edges?: { source: string; target: string }[] } = {}
): RUENode[] {
  const { direction = "horizontal", edges = [] } = options;

  const treeNodes = nodes.filter((n) => TREE_NODE_TYPES.has(n.type));
  const freeNodes = nodes.filter((n) => !TREE_NODE_TYPES.has(n.type));

  const nodesWithParents = attachParentsFromEdges(treeNodes, edges);

  const laidTree =
    direction === "vertical"
      ? applyVerticalLayout(nodesWithParents, domHeights)
      : applyhorizontalLayout(nodesWithParents, domHeights);

  // Re-merge, preserving the original array order, so free nodes keep
  // exactly the x/y the user last dragged them to.
  const laidById = new Map(laidTree.map((n) => [n.id, n]));
  const freeById = new Map(freeNodes.map((n) => [n.id, n]));
  return nodes.map((n) => laidById.get(n.id) ?? freeById.get(n.id) ?? n);
}