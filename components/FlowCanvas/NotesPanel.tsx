"use client";

import React, { useState, useRef, useEffect } from "react";
import { NoteItem } from "./types";

interface NotesPanelProps {
  notes: NoteItem[];
  onAdd: (text: string) => void;
  onPlace: (text: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ notes, onAdd, onPlace, onDelete, onClearAll }) => {
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const PANEL_W  = 240;
  const PANEL_H  = 320;
  const BTN_SIZE = 56;
  const MARGIN   = 24;

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragDist  = useRef(0);

  useEffect(() => {
    setIsClient(true);
    setPos({
      x: window.innerWidth  - BTN_SIZE - MARGIN,
      y: window.innerHeight - BTN_SIZE - MARGIN,
    });
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const handleResize = () => {
      setPos((prev) => ({
        x: Math.min(prev.x, window.innerWidth  - (collapsed ? BTN_SIZE : PANEL_W) - MARGIN),
        y: Math.min(prev.y, window.innerHeight - (collapsed ? BTN_SIZE : PANEL_H) - MARGIN),
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient, collapsed]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (["INPUT", "BUTTON"].includes(target.tagName) || target.closest(".note-item")) return;
    setIsDragging(true);
    dragDist.current = 0;
    dragStart.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      dragDist.current += Math.abs(e.movementX) + Math.abs(e.movementY);
      const width  = collapsed ? BTN_SIZE : PANEL_W;
      const height = collapsed ? BTN_SIZE : PANEL_H;
      setPos({
        x: Math.min(Math.max(0, e.clientX - dragStart.current.x), window.innerWidth  - width),
        y: Math.min(Math.max(0, e.clientY - dragStart.current.y), window.innerHeight - height),
      });
    };
    const onMouseUp = () => setTimeout(() => setIsDragging(false), 50);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, collapsed]);

  const togglePanel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (dragDist.current >= 5) return;

    setCollapsed((prev) => {
      const nextCollapsed = !prev;
      const nextW = nextCollapsed ? BTN_SIZE : PANEL_W;
      const nextH = nextCollapsed ? BTN_SIZE : PANEL_H;
      setPos((p) => ({
        x: Math.min(Math.max(0, p.x), window.innerWidth  - nextW  - MARGIN),
        y: Math.min(Math.max(0, p.y), window.innerHeight - nextH  - MARGIN),
      }));
      return nextCollapsed;
    });
  };

  if (!isClient) return null;

  // ── Collapsed FAB ──────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div
        onMouseDown={handleMouseDown}
        onClick={() => togglePanel()}
        style={{
          position: "fixed",
          left: pos.x,
          top: pos.y,
          width: BTN_SIZE,
          height: BTN_SIZE,
          borderRadius: "50%",
          background: "var(--accent, #10b981)",
          color: "white",
          cursor: isDragging ? "grabbing" : "pointer",
          zIndex: 1000,
          boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
          fontSize: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: isDragging
            ? "none"
            : "transform 0.2s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.2s",
          userSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!isDragging) (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
      >
        📋
      </div>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: PANEL_W,
        height: PANEL_H,
        background: "var(--bg-surface, #0a0a0f)",
        border: `1px solid ${isDragging ? "var(--accent, #10b981)" : "var(--border-subtle, #2a2a42)"}`,
        borderRadius: 20,
        zIndex: 1000,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: isDragging
          ? "0 0 30px rgba(16,185,129,0.1)"
          : "var(--shadow-modal, 0 20px 50px rgba(0,0,0,0.7))",
        transition: isDragging ? "none" : "border-color 0.2s, box-shadow 0.2s, background 0.3s",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          cursor: isDragging ? "grabbing" : "grab",
          background: "rgba(16,185,129,0.05)",
          borderBottom: "1px solid var(--border-subtle, rgba(255,255,255,0.05))",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "#10b981",
          }} />
          <span style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: "#10b981",
            letterSpacing: "1px",
          }}>
            NOTES
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {notes.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Clear all notes? This can't be undone.")) onClearAll();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="Clear all notes"
              style={{
                background: "var(--bg-surface-2, rgba(255,255,255,0.05))",
                border: "1px solid var(--border-subtle, transparent)",
                color: "var(--text-muted, #64748b)",
                cursor: "pointer",
                fontSize: 9,
                letterSpacing: "0.05em",
                borderRadius: 6,
                padding: "4px 8px",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.15)";
                (e.currentTarget as HTMLButtonElement).style.color = "#f87171";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-surface-2, rgba(255,255,255,0.05))";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted, #64748b)";
              }}
            >
              Clear
            </button>
          )}
          <button
            onClick={(e) => togglePanel(e)}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-surface-2, rgba(255,255,255,0.05))",
              border: "1px solid var(--border-subtle, transparent)",
              color: "var(--text-muted, #64748b)",
              cursor: "pointer",
              width: 24,
              height: 24,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--toggle-hover-bg, rgba(255,255,255,0.1))";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-surface-2, rgba(255,255,255,0.05))";
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px",
        // Themed scrollbar
        scrollbarWidth: "thin",
        scrollbarColor: "var(--border-mid, #3a3a5a) transparent",
      }}>
        {notes.length === 0 ? (
          <div style={{
            color: "var(--text-faint, #475569)",
            fontSize: 10, textAlign: "center", marginTop: 20,
          }}>
            No notes yet...
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="note-item"
              onClick={() => onPlace(note.text)}
              style={{
                background: "var(--bg-surface-2, rgba(255,255,255,0.03))",
                border: "1px solid var(--border-subtle, #1e1e2d)",
                borderRadius: 10,
                padding: "10px",
                marginBottom: 8,
                fontSize: 10,
                color: "var(--text-secondary, #94a3b8)",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#10b981";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--toggle-hover-bg, rgba(16,185,129,0.05))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--border-subtle, #1e1e2d)";
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-surface-2, rgba(255,255,255,0.03))";
              }}
            >
              <span style={{ color: "#10b981", flexShrink: 0 }}>•</span>
              <span style={{ flex: 1 }}>{note.text}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Delete note"
                style={{
                  flexShrink: 0,
                  background: "transparent",
                  border: "none",
                  color: "var(--text-faint, #475569)",
                  cursor: "pointer",
                  fontSize: 11,
                  lineHeight: 1,
                  padding: 2,
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#f87171")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-faint, #475569)")}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: "12px",
        background: "rgba(0,0,0,0.08)",
        borderTop: "1px solid var(--border-subtle, #2a2a42)",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim()) {
              onAdd(input.trim());
              setInput("");
            }
          }}
          placeholder="New note…"
          style={{
            width: "100%",
            background: "var(--bg-surface-2, #161620)",
            border: "1px solid var(--border-subtle, #2a2a42)",
            borderRadius: 10,
            color: "var(--text-primary, #e2e8f0)",
            padding: "10px",
            fontSize: 11,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "#10b981";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor =
              "var(--border-subtle, #2a2a42)";
          }}
        />
      </div>
    </div>
  );
};