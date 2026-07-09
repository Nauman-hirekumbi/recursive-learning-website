"use client";

import React, { useRef, useEffect, useState } from "react";
import { RUENode, NodeType, NODE_COLORS } from "./types";

interface NodeCardProps {
  node: RUENode;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent, id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onKeywordClick: (parentId: string, kw: string) => void;
  onDoubleClick: (id: string) => void;
  onLabelChange: (id: string, newLabel: string) => void;
}

// Theme-aware styles using CSS variables
const typeStylesDark: Record<NodeType, React.CSSProperties> = {
  main: {
    background: "linear-gradient(135deg, #1e0a3c 0%, #2d1060 100%)",
    borderColor: NODE_COLORS.main,
    color: "#e9d5ff",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
  },
  keyword: {
    background: "linear-gradient(135deg, #0c2233 0%, #0e3a50 100%)",
    borderColor: NODE_COLORS.keyword,
    color: "#7dd3fc",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
  },
  sub: {
    background: "linear-gradient(135deg, #062019 0%, #073d2a 100%)",
    borderColor: NODE_COLORS.sub,
    color: "#6ee7b7",
  },
  note: {
    background: "linear-gradient(135deg, #2a1a00 0%, #3d2600 100%)",
    borderColor: NODE_COLORS.note,
    color: "#fcd34d",
    fontFamily: "'Syne', sans-serif",
  },
  text: {
    background: "transparent",
    borderColor: "transparent",
    color: "#e2e8f0",
    fontSize: 13,
  },
};

const typeStylesLight: Record<NodeType, React.CSSProperties> = {
  main: {
    background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
    borderColor: "#7c3aed",
    color: "#4c1d95",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
  },
  keyword: {
    background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    borderColor: "#0891b2",
    color: "#075985",
    fontFamily: "'Syne', sans-serif",
    fontWeight: 600,
  },
  sub: {
    background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    borderColor: "#059669",
    color: "#064e3b",
  },
  note: {
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    borderColor: "#d97706",
    color: "#78350f",
    fontFamily: "'Syne', sans-serif",
  },
  text: {
    background: "transparent",
    borderColor: "transparent",
    color: "#1a1a2e",
    fontSize: 13,
  },
};

const EditableDiv: React.FC<{
  initialValue: string;
  placeholder: string;
  color?: string;
  onChange: (val: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}> = ({ initialValue, placeholder, color, onChange, onFocus, onBlur }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerText =
        initialValue === "Type here..." || initialValue === "Note..."
          ? ""
          : initialValue;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="editable-placeholder"
        data-placeholder={placeholder}
        onClick={(e) => e.stopPropagation()}
        onInput={(e) => onChange((e.target as HTMLElement).innerText)}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{ outline: "none", minHeight: 20, color, cursor: "text" }}
      />
      <style>{`
        .editable-placeholder:empty:before {
          content: attr(data-placeholder);
          color: var(--text-muted, #475569);
          cursor: text;
        }
      `}</style>
    </>
  );
};

// ── Inline keyword highlighter ────────────────────────────────────────────────
function renderInlineKeywords(
  label: string,
  keywords: string[],
  usedKeywords: string[],
  nodeId: string,
  onKeywordClick: (parentId: string, kw: string) => void
): React.ReactNode {
  if (!keywords.length) return label;

  const usedSet = new Set(usedKeywords);

  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const escaped = sorted.map((kw) =>
    kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = label.split(pattern);

  return parts.map((part, i) => {
    const matchedKw = keywords.find(
      (kw) => kw.toLowerCase() === part.toLowerCase()
    );

    if (!matchedKw) return <React.Fragment key={i}>{part}</React.Fragment>;

    const isUsed = usedSet.has(matchedKw);

    return (
      <span
        key={i}
        title={isUsed ? "Already expanded" : `Explore: ${matchedKw}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (isUsed) return;
          onKeywordClick(nodeId, matchedKw);
        }}
        style={{
          display: "inline",
          background: isUsed ? "transparent" : "rgba(8,145,178,0.22)",
          color: isUsed ? "inherit" : "#38bdf8",
          borderBottom: isUsed ? "none" : "1px solid rgba(56,189,248,0.6)",
          borderRadius: isUsed ? 0 : 3,
          padding: isUsed ? "0" : "0 3px",
          cursor: isUsed ? "default" : "pointer",
          opacity: isUsed ? 0.45 : 1,
          textDecoration: "none",
          transition: "all 0.15s",
          fontWeight: isUsed ? "inherit" : 600,
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseEnter={(e) => {
          if (!isUsed)
            (e.currentTarget as HTMLElement).style.background =
              "rgba(8,145,178,0.38)";
        }}
        onMouseLeave={(e) => {
          if (!isUsed)
            (e.currentTarget as HTMLElement).style.background =
              "rgba(8,145,178,0.22)";
        }}
      >
        {part}
      </span>
    );
  });
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  selected,
  onMouseDown,
  onContextMenu,
  onKeywordClick,
  onDoubleClick,
  onLabelChange,
}) => {
  const { id, type, label, keywords = [], usedKeywords = [] } = node;
  const [isFocused, setIsFocused] = useState(false);
  // Read current theme from the root element
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () => {
      setIsDark(document.documentElement.getAttribute("data-theme") !== "light");
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const typeStyles = isDark ? typeStylesDark : typeStylesLight;

  const showInlineHighlight =
    keywords.length > 0 &&
    (type === "main" || type === "keyword" || type === "sub");

  const accentColor = isDark ? "#7c3aed" : "#6d28d9";
  const selectionGlow = isDark
    ? "0 0 0 2px white, 0 0 30px rgba(124,58,237,0.3)"
    : "0 0 0 2px #6d28d9, 0 0 20px rgba(109,40,217,0.2)";

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: node.x,
    top: node.y,
    minWidth: type === "text" ? 80 : 160,
    maxWidth: type === "main" ? 300 : 240,
    padding: type === "text" ? "6px 10px" : "12px 14px",
    borderRadius: 10,
    fontSize: type === "main" ? 13 : 11,
    lineHeight: 1.65,
    wordBreak: "break-word",
    cursor: "pointer",
    userSelect: "none",
    transition: "all 0.2s ease",
    transform: selected ? "scale(1.02)" : "scale(1)",
    border: "1.5px solid",
    borderColor:
      type === "text" && isFocused
        ? accentColor
        : type === "text" && selected
        ? isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"
        : typeStyles[type].borderColor,
    background:
      type === "text" && isFocused
        ? isDark ? "rgba(124,58,237,0.05)" : "rgba(109,40,217,0.04)"
        : typeStyles[type].background,
    boxShadow: selected
      ? selectionGlow
      : isFocused
      ? `0 0 15px ${isDark ? "rgba(124,58,237,0.2)" : "rgba(109,40,217,0.15)"}`
      : isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.12)",
    zIndex: isFocused ? 100 : 1,
  };

  const typeTag = (label: string, color?: string) => (
    <span
      style={{
        display: "inline-block",
        fontSize: 9,
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        marginBottom: 4,
        opacity: 0.55,
        color: color ?? "inherit",
      }}
    >
      {label}
    </span>
  );

  // ── Drag handle for text/note cards ──────────────────────────────────────
  // The editable area used to fill almost the entire card (only ~6-10px of
  // padding remained outside it), so a mousedown almost always landed on
  // `[contenteditable]` and onNodeMouseDown bailed out of starting a drag —
  // making these cards effectively unmoveable. This small grip strip sits
  // outside the editable field entirely, so it always initiates a drag,
  // while the rest of the card stays dedicated to editing text.
  const dragHandle = (type === "text" || type === "note") && (
    <div
      onMouseDown={(e) => onMouseDown(e, id)}
      title="Drag to move"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        cursor: "grab",
        marginBottom: type === "note" ? 5 : 4,
        userSelect: "none",
      }}
    >
      <span style={{ display: "flex", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 3, height: 3, borderRadius: "50%",
              background: "currentColor", opacity: 0.4,
            }}
          />
        ))}
      </span>
      {type === "note" && typeTag("NOTE")}
    </div>
  );

  return (
    <div
      id={`node-${id}`}
      data-node={id}
      style={{
        ...baseStyle,
        ...typeStyles[type],
        borderColor: baseStyle.borderColor,
        background: baseStyle.background,
      }}
      onMouseDown={(e) => onMouseDown(e, id)}
      onContextMenu={(e) => onContextMenu(e, id)}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).getAttribute("contenteditable")) return;
        onDoubleClick(id);
      }}
    >
      {type === "main" && (
        <span
          style={{
            display: "inline-block",
            background: isDark ? "rgba(124,58,237,0.3)" : "rgba(109,40,217,0.12)",
            color: isDark ? "#c4b5fd" : "#6d28d9",
            fontSize: 9,
            padding: "1px 6px",
            borderRadius: 3,
            marginBottom: 6,
            letterSpacing: "0.08em",
          }}
        >
          CONCEPT
        </span>
      )}
      {type === "keyword" && typeTag("EXPLORE →")}
      {dragHandle}

      {type === "text" || type === "note" ? (
        <EditableDiv
          initialValue={label}
          placeholder={type === "text" ? "Type here..." : "Note..."}
          color={type === "text" ? (isDark ? "#e2e8f0" : "#1a1a2e") : undefined}
          onChange={(val) => onLabelChange(id, val)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      ) : showInlineHighlight ? (
        <div style={{ lineHeight: 1.65 }}>
          {renderInlineKeywords(label, keywords, usedKeywords, id, onKeywordClick)}
        </div>
      ) : (
        <div>{label}</div>
      )}
    </div>
  );
};
