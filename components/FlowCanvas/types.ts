export type NodeType = "main" | "keyword" | "sub" | "note" | "text";
export type Tool =
  | "select"
  | "hand"
  | "rect"
  | "ellipse"
  | "diamond"
  | "arrow"
  | "text"
  | "note";

export interface RUENode {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  label: string;
  keywords?: string[];
  usedKeywords?: string[];
  parent?: string;
}

export interface RUEEdge {
  id: string;
  source: string;
  target: string;
  color?: "purple" | "cyan" | "amber" | "green";
}

export interface DrawnShape {
  id: string;
  shapeType: "rect" | "ellipse" | "diamond";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai" | "loading";
  text: string;
  keywords?: string[];
  nodeId?: string;
}

export interface NoteItem {
  id: string;
  text: string;
}

export const CANVAS_SIZE = 6000;
export const CANVAS_CENTER = CANVAS_SIZE / 2;

export const NODE_COLORS: Record<NodeType, string> = {
  main: "#7c3aed",
  keyword: "#0891b2",
  sub: "#059669",
  note: "#d97706",
  text: "transparent",
};

export const EDGE_COLOR_MAP: Record<string, string> = {
  purple: "#7c3aed",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  green: "#10b981",
};