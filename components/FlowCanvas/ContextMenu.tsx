"use client";

import React, { useEffect } from "react";
import { RUENode, DrawnShape, NoteItem } from "./types";

interface CtxMenuState {
  x: number;
  y: number;
  targetId: string;
}

interface ContextMenuProps {
  ctxMenu: CtxMenuState;
  nodes: RUENode[];
  shapes?: DrawnShape[];
  onClose: () => void;
  onExplore: (id: string, label: string) => void;
  onAddToNotes: (note: NoteItem) => void;
  onDuplicate: (node: RUENode) => void;
  onDuplicateShape?: (shape: DrawnShape) => void;
  onDelete: (id: string) => void;
  onDeleteShape?: (id: string) => void;
  newId: () => string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  ctxMenu, nodes, shapes = [], onClose, onExplore, onAddToNotes,
  onDuplicate, onDuplicateShape, onDelete, onDeleteShape, newId,
}) => {
  const node  = nodes.find((x) => x.id === ctxMenu.targetId);
  const shape = !node ? shapes.find((s) => s.id === ctxMenu.targetId) : undefined;

  // Close on outside click or Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".ctx-menu")) onClose();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [onClose]);

  // Drawn shapes have no label/keywords, so they only get Duplicate + Delete.
  const items = shape
    ? [
        {
          icon: "⧉", label: "Duplicate",
          action: () => { onDuplicateShape?.(shape); onClose(); },
        },
        {
          icon: "🗑", label: "Delete",
          action: () => { onDeleteShape?.(ctxMenu.targetId); onClose(); },
          danger: true,
        },
      ]
    : [
        {
          icon: "🔍", label: "Explore concept",
          action: () => { if (node) onExplore(node.id, node.label); onClose(); },
        },
        {
          icon: "📝", label: "Add to notes",
          action: () => {
            if (node) onAddToNotes({ id: newId(), text: node.label.slice(0, 80) });
            onClose();
          },
        },
        null,
        {
          icon: "⧉", label: "Duplicate",
          action: () => { if (node) onDuplicate(node); onClose(); },
        },
        {
          icon: "🗑", label: "Delete",
          action: () => { onDelete(ctxMenu.targetId); onClose(); },
          danger: true,
        },
      ];

  // Clamp position so menu doesn't overflow viewport
  const menuW = 170;
  const menuH = items.length * 34 + 20;
  const left = Math.min(ctxMenu.x, window.innerWidth - menuW - 8);
  const top  = Math.min(ctxMenu.y, window.innerHeight - menuH - 8);

  return (
    <>
      <style>{`
        :root, [data-theme="dark"] {
          --ctx-bg:     #12121a;
          --ctx-border: #2a2a42;
          --ctx-hover:  #1a1a28;
          --ctx-color:  #e2e8f0;
          --ctx-div:    #2a2a42;
        }
        [data-theme="light"] {
          --ctx-bg:     #ffffff;
          --ctx-border: #d8d8e8;
          --ctx-hover:  #f0f0f8;
          --ctx-color:  #1a1a2e;
          --ctx-div:    #e2e2ee;
        }
      `}</style>
      <div
        className="ctx-menu"
        style={{
          position: "fixed", left, top,
          background: "var(--ctx-bg)",
          border: "1px solid var(--ctx-border)",
          borderRadius: 10, padding: "4px 0", zIndex: 300,
          minWidth: menuW,
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
          transition: "background 0.2s, border-color 0.2s",
        }}
      >
        {items.map((item, i) =>
          item === null ? (
            <div key={i} style={{ height: 1, background: "var(--ctx-div)", margin: "3px 0" }} />
          ) : (
            <div
              key={i}
              style={{
                padding: "8px 14px", fontSize: 12, cursor: "pointer",
                borderRadius: 5,
                color: (item as any).danger ? "#ef4444" : "var(--ctx-color)",
                display: "flex", alignItems: "center", gap: 9,
                transition: "background 0.1s",
                margin: "0 4px",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ctx-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={item.action}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
            </div>
          )
        )}
      </div>
    </>
  );
};
