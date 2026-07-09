import React from "react";

export const SvgDefs = () => (
  <defs>
    {[
      ["purple", "#7c3aed"],
      ["cyan",   "#06b6d4"],
      ["amber",  "#f59e0b"],
      ["green",  "#10b981"],
    ].map(([name, color]) => (
      <marker
        key={name}
        id={`arrow-${name}`}
        markerWidth="8" markerHeight="6"
        refX="7" refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" fill={color} opacity="0.85" />
      </marker>
    ))}
  </defs>
);

export function cubicPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return `M${x1},${y1} C${x1 + dx * 0.4},${y1 + dy * 0.1} ${x1 + dx * 0.6},${y1 + dy * 0.9} ${x2},${y2}`;
}

// Theme-aware separator — uses CSS variables set by Toolbar
export function Sep() {
  return (
    <div style={{ width: 1, height: 24, background: "var(--tb-divider, #2a2a42)", margin: "0 3px" }} />
  );
}

// Theme-aware tool button (legacy, kept for compatibility)
export function ToolBtn({
  icon, title, active, onClick,
}: {
  icon: string; title: string; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 34, height: 34,
        border: `1px solid ${active ? "var(--accent-border, rgba(124,58,237,0.5))" : "transparent"}`,
        borderRadius: 7,
        background: active ? "var(--accent-glow, rgba(124,58,237,0.2))" : "transparent",
        color: active ? "var(--accent-text, #c4b5fd)" : "var(--text-muted, #64748b)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15,
        fontFamily: "'Space Mono',monospace",
        transition: "all 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--toggle-hover-bg, #1a1a28)";
          e.currentTarget.style.color = "var(--text-primary, #e2e8f0)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-muted, #64748b)";
        }
      }}
    >
      {icon}
    </button>
  );
}

// Theme-aware UI toggle button (legacy, kept for compatibility)
export function UIToggle({
  icon, on, onClick, title,
}: {
  icon: string; on: boolean; onClick: () => void; title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 34, height: 34,
        background: "var(--toggle-bg, #12121a)",
        border: `1px solid ${on ? "rgba(6,182,212,0.4)" : "var(--toggle-border, #2a2a42)"}`,
        borderRadius: 8,
        color: on ? "#06b6d4" : "var(--toggle-icon, #64748b)",
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14,
        transition: "all 0.12s",
      }}
    >
      {icon}
    </button>
  );
}
