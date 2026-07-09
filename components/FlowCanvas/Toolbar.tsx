"use client";

import React from "react";
import { Tool } from "./types";

interface ToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  applyZoom: (f: number) => void;
  fitView: () => void;
  onClear: () => void;
  onDownloadNotes: () => void;
  chatVisible: boolean;
  setChatVisible: (v: boolean) => void;
  notesVisible: boolean;
  setNotesVisible: (v: boolean) => void;
  layoutDirection: "vertical" | "horizontal";
  setLayoutDirection: (dir: "vertical" | "horizontal") => void;
  toggleTheme: () => void;
  isDark: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  applyZoom,
  fitView,
  onClear,
  onDownloadNotes,
  chatVisible,
  setChatVisible,
  notesVisible,
  setNotesVisible,
  layoutDirection,
  setLayoutDirection,
  toggleTheme,
  isDark,
}) => {

  const btnStyle = (isActive: boolean, isDestructive = false): React.CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: isActive ? "var(--tb-active-bg, rgba(124,58,237,0.2))" : "transparent",
    border: `1px solid ${isActive ? "var(--tb-active-border, #7c3aed)" : "transparent"}`,
    color: isDestructive
      ? "var(--tb-destructive, #ef4444)"
      : isActive
      ? "var(--tb-active-color, #a78bfa)"
      : "var(--tb-idle-color, #94a3b8)",
    transition: "all 0.2s ease",
    outline: "none",
    fontSize: isActive ? "16px" : "15px",
  });

  const Icon = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );

  const Divider = () => (
    <div style={{
      width: 1,
      background: "var(--tb-divider, #2a2a42)",
      margin: "6px 4px",
      alignSelf: "stretch",
    }} />
  );

  return (
    <>
      <style>{`
        :root, [data-theme="dark"] {
          --tb-center-bg:       rgba(13,13,20,0.92);
          --tb-center-border:   #2a2a42;
          --tb-right-bg:        rgba(10,10,15,0.6);
          --tb-right-border:    #2a2a42;
          --tb-divider:         #2a2a42;
          --tb-active-bg:       rgba(124,58,237,0.2);
          --tb-active-border:   #7c3aed;
          --tb-active-color:    #a78bfa;
          --tb-idle-color:      #94a3b8;
          --tb-destructive:     #ef4444;
          --tb-chat-on-bg:      #7c3aed;
          --tb-chat-on-border:  #a78bfa;
          --tb-chat-off-bg:     rgba(30,30,45,0.9);
          --tb-chat-off-border: #2a2a42;
          --tb-chat-on-color:   #ffffff;
          --tb-chat-off-color:  #e2e8f0;
          --tb-shadow:          0 10px 40px rgba(0,0,0,0.5);
          --tb-btn-hover-bg:    rgba(255,255,255,0.06);
        }
        [data-theme="light"] {
          --tb-center-bg:       rgba(255,255,255,0.96);
          --tb-center-border:   #d8d8e8;
          --tb-right-bg:        rgba(245,245,250,0.95);
          --tb-right-border:    #d8d8e8;
          --tb-divider:         #d8d8e8;
          --tb-active-bg:       rgba(109,40,217,0.12);
          --tb-active-border:   #6d28d9;
          --tb-active-color:    #6d28d9;
          --tb-idle-color:      #4a4a6a;
          --tb-destructive:     #dc2626;
          --tb-chat-on-bg:      #6d28d9;
          --tb-chat-on-border:  #7c3aed;
          --tb-chat-off-bg:     rgba(240,240,248,0.95);
          --tb-chat-off-border: #d8d8e8;
          --tb-chat-on-color:   #ffffff;
          --tb-chat-off-color:  #1a1a2e;
          --tb-shadow:          0 10px 40px rgba(0,0,0,0.1);
          --tb-btn-hover-bg:    rgba(0,0,0,0.05);
        }
        .tb-btn:hover { background: var(--tb-btn-hover-bg) !important; }
        .tb-btn-active:hover { background: var(--tb-active-bg) !important; }
      `}</style>

      {/* ── TOP LEFT: CHAT TOGGLE ── */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 100 }}>
        <button
          onClick={() => setChatVisible(!chatVisible)}
          style={{
            width: "auto", padding: "0 14px", gap: 8, height: 42,
            borderRadius: 12, display: "flex", alignItems: "center",
            background: chatVisible ? "var(--tb-chat-on-bg)" : "var(--tb-chat-off-bg)",
            border: `1px solid ${chatVisible ? "var(--tb-chat-on-border)" : "var(--tb-chat-off-border)"}`,
            color: chatVisible ? "var(--tb-chat-on-color)" : "var(--tb-chat-off-color)",
            fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 11,
            cursor: "pointer", boxShadow: "var(--tb-shadow)",
            transition: "background 0.2s, border-color 0.2s, color 0.2s",
          }}
        >
          <Icon size={14}><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" /></Icon>
          {chatVisible ? "HIDE CHAT" : "AI RESEARCH"}
        </button>
      </div>

      {/* ── CENTER TOP: MAIN TOOLS ── */}
      <div style={{
        position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
        background: "var(--tb-center-bg)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)", padding: "6px", borderRadius: 16,
        border: "1px solid var(--tb-center-border)", display: "flex", gap: 4,
        zIndex: 100, boxShadow: "var(--tb-shadow)",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        <button className={`tb-btn${tool === "select" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "select")} onClick={() => setTool("select")} title="Select (V)">
          <Icon><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></Icon>
        </button>
        <button className={`tb-btn${tool === "hand" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "hand")} onClick={() => setTool("hand")} title="Hand Tool (H)">
          <Icon>
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5"/>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10"/>
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
          </Icon>
        </button>

        <Divider />

        <button className={`tb-btn${tool === "rect" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "rect")} onClick={() => setTool("rect")} title="Rectangle (R)">
          <Icon><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></Icon>
        </button>
        <button className={`tb-btn${tool === "ellipse" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "ellipse")} onClick={() => setTool("ellipse")} title="Ellipse (E)">
          <Icon><circle cx="12" cy="12" r="9"/></Icon>
        </button>
        <button className={`tb-btn${tool === "diamond" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "diamond")} onClick={() => setTool("diamond")} title="Diamond (D)">
          <Icon><path d="M2.7 10.3a2.4 2.4 0 0 0 0 3.4l8.6 8.6a2.4 2.4 0 0 0 3.4 0l8.6-8.6a2.4 2.4 0 0 0 0-3.4l-8.6-8.6a2.4 2.4 0 0 0-3.4 0z"/></Icon>
        </button>
        <button className={`tb-btn${tool === "arrow" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "arrow")} onClick={() => setTool("arrow")} title="Arrow (A)">
          <Icon><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></Icon>
        </button>

        <Divider />

        <button className={`tb-btn${tool === "text" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "text")} onClick={() => setTool("text")} title="Text (T)">
          <Icon><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></Icon>
        </button>
        <button className={`tb-btn${tool === "note" ? " tb-btn-active" : ""}`} style={btnStyle(tool === "note")} onClick={() => setTool("note")} title="Sticky Note (N)">
          <Icon>
            <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/>
            <path d="M15 3v6h6"/>
          </Icon>
        </button>

        <Divider />

        <button className={`tb-btn${layoutDirection === "vertical" ? " tb-btn-active" : ""}`} style={btnStyle(layoutDirection === "vertical")} onClick={() => setLayoutDirection("vertical")} title="Vertical Layout">↓</button>
        <button className={`tb-btn${layoutDirection === "horizontal" ? " tb-btn-active" : ""}`} style={btnStyle(layoutDirection === "horizontal")} onClick={() => setLayoutDirection("horizontal")} title="Horizontal Layout">→</button>
      </div>

      {/* ── TOP RIGHT: VIEW, UTILS + THEME TOGGLE ── */}
      <div style={{
        position: "absolute", top: 20, right: 20, zIndex: 100,
        display: "flex", gap: 6,
        background: "var(--tb-right-bg)", padding: "4px", borderRadius: 12,
        border: "1px solid var(--tb-right-border)",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        <button className="tb-btn" style={btnStyle(false)} onClick={() => applyZoom(1.2)} title="Zoom In">
          <Icon><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></Icon>
        </button>
        <button className="tb-btn" style={btnStyle(false)} onClick={() => applyZoom(0.8)} title="Zoom Out">
          <Icon><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></Icon>
        </button>

        <Divider />

        <button className="tb-btn" style={btnStyle(false)} onClick={onDownloadNotes} title="Download full notes as PDF (all pages)">
          <Icon>
            <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>
          </Icon>
        </button>

        <Divider />

        <button className="tb-btn" style={btnStyle(false)} onClick={fitView} title="Fit View (F)">
          <Icon>
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
          </Icon>
        </button>

        <Divider />

        <button className={`tb-btn${notesVisible ? " tb-btn-active" : ""}`} style={btnStyle(notesVisible)} onClick={() => setNotesVisible(!notesVisible)} title="Toggle Notes">
          <Icon>
            <path d="m7.5 4.27 9 5.15"/>
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
          </Icon>
        </button>
        <button className="tb-btn" style={btnStyle(false, true)} onClick={onClear} title="Clear All">
          <Icon>
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </Icon>
        </button>

        <Divider />

        {/* ── Theme toggle — lives inside the right cluster ── */}
        <button
          className="tb-btn"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
          style={btnStyle(false)}
        >
          {isDark ? (
            // Sun icon — shown in dark mode to indicate "switch to light"
            <Icon>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" /><path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" /><path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
            </Icon>
          ) : (
            // Moon icon — shown in light mode to indicate "switch to dark"
            <Icon>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </Icon>
          )}
        </button>
      </div>
    </>
  );
};