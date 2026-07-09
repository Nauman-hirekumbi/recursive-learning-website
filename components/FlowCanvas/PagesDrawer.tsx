"use client";

import React, { useState } from "react";
import { ChatPage } from "./hooks/useChatPages";

interface PagesDrawerProps {
  pages: ChatPage[];
  activePageId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export const PagesDrawer: React.FC<PagesDrawerProps> = ({
  pages,
  activePageId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const startEdit = (page: ChatPage) => {
    setEditingId(page.id);
    setEditVal(page.title);
  };

  const commitEdit = (id: string) => {
    if (editVal.trim()) onRename(id, editVal.trim());
    setEditingId(null);
  };

  return (
    <>
      <style>{`
        :root, [data-theme="dark"] {
          --pd-bg:         #08080f;
          --pd-border:     #1e1e2e;
          --pd-hdr-color:  #475569;
          --pd-title:      #e2e8f0;
          --pd-subtitle:   #94a3b8;
          --pd-meta:       #334155;
          --pd-hover:      rgba(255,255,255,0.04);
          --pd-input-bg:   rgba(255,255,255,0.08);
          --pd-input-col:  #e2e8f0;
        }
        [data-theme="light"] {
          --pd-bg:         #f8f8fc;
          --pd-border:     #e2e2ee;
          --pd-hdr-color:  #6b6b8a;
          --pd-title:      #1a1a2e;
          --pd-subtitle:   #4a4a6a;
          --pd-meta:       #9090a8;
          --pd-hover:      rgba(0,0,0,0.04);
          --pd-input-bg:   rgba(0,0,0,0.06);
          --pd-input-col:  #1a1a2e;
        }
      `}</style>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--pd-bg)",
          transition: "background 0.3s",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 14px 8px",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--pd-hdr-color)",
            textTransform: "uppercase",
            borderBottom: "1px solid var(--pd-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "border-color 0.3s, color 0.3s",
          }}
        >
          <span>Pages</span>
          <button
            onClick={onAdd}
            title="New page"
            style={{
              background: "rgba(124,58,237,0.18)",
              border: "1px solid rgba(124,58,237,0.4)",
              borderRadius: 6,
              color: "#a78bfa",
              cursor: "pointer",
              fontSize: 14,
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              padding: 0,
            }}
          >
            +
          </button>
        </div>

        {/* Page list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {pages.map((page) => {
            const isActive = page.id === activePageId;
            const isEditing = editingId === page.id;
            const msgCount = page.messages.filter(
              (m) => m.role !== "loading"
            ).length;

            return (
              <div
                key={page.id}
                onClick={() => !isEditing && onSelect(page.id)}
                style={{
                  margin: "2px 6px",
                  borderRadius: 8,
                  padding: "8px 10px",
                  background: isActive
                    ? `rgba(${hexToRgb(page.color)},0.15)`
                    : "transparent",
                  border: `1px solid ${
                    isActive
                      ? `rgba(${hexToRgb(page.color)},0.4)`
                      : "transparent"
                  }`,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--pd-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                }}
              >
                {/* Color dot + title */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: page.color,
                      flexShrink: 0,
                      boxShadow: isActive ? `0 0 6px ${page.color}` : "none",
                    }}
                  />

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      onBlur={() => commitEdit(page.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(page.id);
                        if (e.key === "Escape") setEditingId(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: "var(--pd-input-bg)",
                        border: "1px solid #7c3aed",
                        borderRadius: 4,
                        color: "var(--pd-input-col)",
                        fontSize: 11,
                        padding: "1px 5px",
                        width: "100%",
                        outline: "none",
                        transition: "background 0.2s, color 0.2s",
                      }}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(page);
                      }}
                      style={{
                        fontSize: 11,
                        color: isActive ? "var(--pd-title)" : "var(--pd-subtitle)",
                        fontWeight: isActive ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        transition: "color 0.2s",
                      }}
                    >
                      {page.title}
                    </span>
                  )}
                </div>

                {/* Meta row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingLeft: 14,
                  }}
                >
                  <span style={{ fontSize: 9, color: "var(--pd-meta)", transition: "color 0.2s" }}>
                    {msgCount} msg{msgCount !== 1 ? "s" : ""}
                  </span>

                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete "${page.title}"? This removes its canvas and chat history permanently.`)) {
                          onDelete(page.id);
                        }
                      }}
                      title="Delete page"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--pd-meta)",
                        cursor: "pointer",
                        fontSize: 11,
                        padding: "0 2px",
                        lineHeight: 1,
                        borderRadius: 4,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "#ef4444")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.color = "var(--pd-meta)")
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "8px 14px",
            fontSize: 9,
            color: "var(--pd-meta)",
            borderTop: "1px solid var(--pd-border)",
            transition: "border-color 0.3s, color 0.3s",
          }}
        >
          {pages.length} page{pages.length !== 1 ? "s" : ""} total
        </div>
      </div>
    </>
  );
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
