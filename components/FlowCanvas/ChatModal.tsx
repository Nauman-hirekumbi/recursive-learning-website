"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./types";
import { ChatPage } from "./hooks/useChatPages";
import { PagesDrawer } from "./PagesDrawer";

interface ChatModalProps {
  messages: ChatMessage[];
  onSend: (q: string) => void;
  onKeywordClick: (parentId: string | null, kw: string) => void;
  onClearChat: () => void;
  visible: boolean;
  setVisible: (v: boolean) => void;
  pages: ChatPage[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, title: string) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  messages,
  onSend,
  onKeywordClick,
  onClearChat,
  visible,
  setVisible,
  pages,
  activePageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
}) => {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  // ── Resize state ──────────────────────────────────────────────────────────
  const [width,  setWidth]  = useState(640);
  const [height, setHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const MIN_WIDTH  = 360;
  const MAX_WIDTH  = typeof window !== "undefined" ? window.innerWidth * 0.95 : 1600;
  const MIN_HEIGHT = 300;
  const resizingX  = useRef(false);
  const resizingY  = useRef(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (resizingX.current)
        setWidth((prev) =>
          Math.min(Math.max(e.clientX, MIN_WIDTH), window.innerWidth * 0.95)
        );
      if (resizingY.current)
        setHeight((prev) =>
          Math.min(
            Math.max(window.innerHeight - e.clientY, MIN_HEIGHT),
            window.innerHeight
          )
        );
    };
    const stop = () => {
      resizingX.current = false;
      resizingY.current = false;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", stop);
    };
  }, []); // no stale MAX_WIDTH dependency — reads window.innerWidth live inside handler

  // Scroll to bottom when new messages arrive OR when modal opens
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() =>
        endRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    }
  }, [messages, visible]);

  // ── BUGFIX: Clear the input field whenever the active page changes.
  // Without this, text typed on one page would survive a page switch and
  // accidentally get sent into the new page's conversation. ──
  useEffect(() => {
    setInput("");
  }, [activePageId]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  const activePage = pages.find((p) => p.id === activePageId);
  const [pagesOpen, setPagesOpen] = useState(false);

  return (
    <div
      className="chat-modal"
      style={{
        position: "fixed",
        left: 0,
        bottom: 0,
        width:  visible ? width  : 0,
        height: visible ? height : 0,
        background: "var(--chat-bg, #0a0a10)",
        borderRight:         "1px solid var(--chat-border, #1e1e2e)",
        borderTop:           "1px solid var(--chat-border, #1e1e2e)",
        borderTopRightRadius: 14,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 999,
        transition: visible
          ? "background 0.3s, border-color 0.3s"
          : "width 0.2s ease, height 0.2s ease",
        boxShadow: "var(--chat-shadow, 4px 0 40px rgba(0,0,0,0.6))",
      }}
    >
      {/* ── Resize handles ── */}
      <div
        onMouseDown={(e) => { e.preventDefault(); resizingX.current = true; }}
        style={{ position: "absolute", right: 0, top: 0, width: 10, height: "100%", cursor: "ew-resize", zIndex: 1000 }}
      />
      <div
        onMouseDown={(e) => { e.preventDefault(); resizingY.current = true; }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 10, cursor: "ns-resize", zIndex: 1000 }}
      />

      {/* ── Header ── */}
      <div
        style={{
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--chat-border, #1e1e2e)",
          gap: 12,
          flexShrink: 0,
          background: "var(--chat-header-bg, transparent)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background:  activePage?.color ?? "#7c3aed",
              boxShadow: `0 0 8px ${activePage?.color ?? "#7c3aed"}`,
              transition: "background 0.2s, box-shadow 0.2s",
            }}
          />
          <span style={{
            color: "var(--chat-title-color, #fff)",
            fontWeight: 700, fontSize: 13,
            fontFamily: "Syne, sans-serif",
            transition: "color 0.3s",
          }}>
            {activePage?.title ?? "RUE AI"}
          </span>

          <span style={{
            fontSize: 9,
            color: "var(--chat-badge-text, #475569)",
            background: "var(--chat-badge-bg, rgba(255,255,255,0.05))",
            border: "1px solid var(--chat-border, #1e1e2e)",
            borderRadius: 4,
            padding: "1px 6px",
            transition: "background 0.3s, color 0.3s",
          }}>
            {pages.length} page{pages.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Toggle pages drawer */}
          <HeaderBtn
            active={pagesOpen}
            color={activePage?.color ?? "#7c3aed"}
            onClick={() => setPagesOpen((o) => !o)}
            title="Toggle pages panel"
          >
            {pagesOpen ? "Hide Pages" : "Pages"}
          </HeaderBtn>

          {/* New page */}
          <HeaderBtn
            color={activePage?.color ?? "#7c3aed"}
            onClick={onAddPage}
            title="New chat page"
          >
            + New Page
          </HeaderBtn>

          {/* Clear this page's chat + its connected canvas graph */}
          <HeaderBtn
            color={activePage?.color ?? "#7c3aed"}
            onClick={() => {
              if (window.confirm("Clear this page's chat conversation and its canvas graph? This can't be undone.")) {
                onClearChat();
              }
            }}
            title="Clear this page's chat and canvas"
          >
            Clear Chat
          </HeaderBtn>

          {/* Close */}
          <button
            onClick={() => setVisible(false)}
            title="Close chat"
            style={{
              background: "var(--chat-close-bg, rgba(255,255,255,0.05))",
              border: "none",
              color: "var(--text-muted, #64748b)",
              cursor: "pointer",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 14,
              lineHeight: 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.15)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--chat-close-bg, rgba(255,255,255,0.05))")}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Pages drawer — slides in from left */}
        <div
          style={{
            position: "absolute",
            left:   pagesOpen ? 0 : -260,
            top: 0, bottom: 0, width: 260,
            background: "var(--chat-drawer-bg, #0a0a10)",
            borderRight: "1px solid var(--chat-border, #1e1e2e)",
            transition: "left 0.22s ease, background 0.3s",
            zIndex: 998,
          }}
        >
          <PagesDrawer
            pages={pages}
            activePageId={activePageId}
            onSelect={(id) => { onSelectPage(id); setPagesOpen(false); }}
            onAdd={onAddPage}
            onDelete={onDeletePage}
            onRename={onRenamePage}
          />
        </div>

        {/* Message area */}
        <div
          style={{
            flex: 1,
            marginLeft: pagesOpen ? 260 : 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transition: "margin-left 0.22s ease",
          }}
        >
          {messages.length === 0 ? (
            <EmptyState activePage={activePage} />
          ) : (
            <MessagesArea
              messages={messages}
              activePage={activePage}
              onKeywordClick={onKeywordClick}
              endRef={endRef}
            />
          )}

          <ChatInput
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            activePage={activePage}
          />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 1; }
        }

        :root, [data-theme="dark"] {
          --chat-bg:            #0a0a10;
          --chat-header-bg:     transparent;
          --chat-drawer-bg:     #0a0a10;
          --chat-border:        #1e1e2e;
          --chat-shadow:        4px 0 40px rgba(0,0,0,0.6);
          --chat-title-color:   #ffffff;
          --chat-badge-bg:      rgba(255,255,255,0.05);
          --chat-badge-text:    #475569;
          --chat-close-bg:      rgba(255,255,255,0.05);
          --chat-close-hover:   rgba(255,255,255,0.1);
          --chat-msg-user-text: #ffffff;
          --chat-msg-bg:        #161622;
          --chat-msg-border:    #1e1e2e;
          --chat-msg-color:     #e2e8f0;
          --chat-meta-color:    #334155;
          --chat-input-bg:      #0d0d18;
          --chat-input-border:  #1e1e2e;
          --chat-input-color:   #ffffff;
          --chat-input-wrap-bg: #0d0d18;
          --chat-empty-color:   #e2e8f0;
          --chat-empty-sub:     #475569;
          --chat-scrollbar:     #1e1e2e;
          --chat-kw-color:      #c4b5fd;
          --chat-highlight:     #7dd3fc;
        }

        [data-theme="light"] {
          --chat-bg:            #ffffff;
          --chat-header-bg:     #fafafa;
          --chat-drawer-bg:     #f8f8fc;
          --chat-border:        #e2e2ee;
          --chat-shadow:        4px 0 40px rgba(0,0,0,0.08);
          --chat-title-color:   #1a1a2e;
          --chat-badge-bg:      rgba(0,0,0,0.04);
          --chat-badge-text:    #6b6b8a;
          --chat-close-bg:      rgba(0,0,0,0.04);
          --chat-close-hover:   rgba(0,0,0,0.08);
          --chat-msg-user-text: #ffffff;
          --chat-msg-bg:        #f0f0f8;
          --chat-msg-border:    #e2e2ee;
          --chat-msg-color:     #1a1a2e;
          --chat-meta-color:    #9090a8;
          --chat-input-bg:      #f8f8fc;
          --chat-input-border:  #d8d8e8;
          --chat-input-color:   #1a1a2e;
          --chat-input-wrap-bg: #f8f8fc;
          --chat-empty-color:   #1a1a2e;
          --chat-empty-sub:     #6b6b8a;
          --chat-scrollbar:     #d8d8e8;
          --chat-kw-color:      #6d28d9;
          --chat-highlight:     #0369a1;
        }

        .chat-modal-messages::-webkit-scrollbar { width: 4px; }
        .chat-modal-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-modal-messages::-webkit-scrollbar-thumb {
          background: var(--chat-scrollbar);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

// ── Small reusable header button ──────────────────────────────────────────────
const HeaderBtn: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  color?: string;
  active?: boolean;
}> = ({ children, onClick, title, color = "#7c3aed", active }) => {
  const base = `rgba(${hexToRgb(color)},${active ? "0.3" : "0.18"})`;
  const hover = `rgba(${hexToRgb(color)},0.38)`;
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: base,
        border: `1px solid rgba(${hexToRgb(color)},0.45)`,
        color: active ? "#fff" : "#a78bfa",
        cursor: "pointer",
        borderRadius: 7,
        padding: "4px 10px",
        fontSize: 10,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 4,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.background = hover)
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.background = base)
      }
    >
      {children}
    </button>
  );
};

// ── EmptyState ────────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ activePage?: ChatPage }> = ({ activePage }) => (
  <div style={{
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: 16, opacity: 0.6, padding: 24,
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: "50%",
      background: `rgba(${hexToRgb(activePage?.color ?? "#7c3aed")},0.15)`,
      border: `1px solid rgba(${hexToRgb(activePage?.color ?? "#7c3aed")},0.35)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 24,
    }}>
      💬
    </div>
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: 13, color: "var(--chat-empty-color, #e2e8f0)",
        marginBottom: 4, fontWeight: 600,
      }}>
        {activePage?.title ?? "New page"}
      </div>
      <div style={{ fontSize: 11, color: "var(--chat-empty-sub, #475569)" }}>
        Ask a research question to get started
      </div>
    </div>
  </div>
);

// ── MessagesArea ──────────────────────────────────────────────────────────────
const MessagesArea: React.FC<{
  messages: ChatMessage[];
  activePage?: ChatPage;
  onKeywordClick: (parentId: string | null, kw: string) => void;
  endRef: React.RefObject<HTMLDivElement | null>;
}> = ({ messages, activePage, onKeywordClick, endRef }) => (
  <div
    className="chat-modal-messages"
    style={{
      flex: 1, overflowY: "auto",
      padding: "16px 16px 8px",
      display: "flex", flexDirection: "column", gap: 14,
    }}
  >
    {messages.map((msg) => {
      const isUser = msg.role === "user";
      const isAI   = msg.role === "ai";
      const color  = activePage?.color ?? "#7c3aed";

      return (
        <div
          key={msg.id}
          style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "86%" }}
        >
          {/* Sender label */}
          <div style={{
            fontSize: 9,
            color: "var(--chat-meta-color, #334155)",
            marginBottom: 3,
            paddingLeft: 2,
            transition: "color 0.3s",
          }}>
            {isUser ? "You" : "Rue AI"}
          </div>

          {/* Bubble */}
          <div style={{
            padding: "10px 13px",
            borderRadius: isUser ? "12px 12px 4px 12px" : "4px 12px 12px 12px",
            background: isUser ? color : "var(--chat-msg-bg, #161622)",
            color: isUser
              ? "var(--chat-msg-user-text, #ffffff)"
              : "var(--chat-msg-color, #e2e8f0)",
            fontSize: 13,
            lineHeight: 1.65,
            border: isUser ? "none" : "1px solid var(--chat-msg-border, #1e1e2e)",
            transition: "background 0.3s, border-color 0.3s, color 0.3s",
          }}>
            {msg.role === "loading" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span
                    key={i}
                    style={{ animation: `pulse 1.2s infinite ${delay}s`, fontSize: 18, lineHeight: 1 }}
                  >
                    ●
                  </span>
                ))}
              </span>
            ) : (
              <span
                dangerouslySetInnerHTML={{
                  __html: msg.text.replace(
                    /\*\*(.*?)\*\*/g,
                    `<b style="color:var(--chat-highlight,#7dd3fc)">$1</b>`
                  ),
                }}
              />
            )}
          </div>

          {/* Keyword chips */}
          {isAI && msg.keywords?.length ? (
            <div style={{ marginTop: 7, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {msg.keywords.map((kw, i) => (
                <button
                  key={i}
                  onClick={() => onKeywordClick(msg.nodeId ?? null, kw)}
                  title={`Explore: ${kw}`}
                  style={{
                    fontSize: 10,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: `rgba(${hexToRgb(color)},0.12)`,
                    border: `1px solid ${color}`,
                    color: "var(--chat-kw-color, #c4b5fd)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      `rgba(${hexToRgb(color)},0.28)`)
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      `rgba(${hexToRgb(color)},0.12)`)
                  }
                >
                  {kw}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      );
    })}
    <div ref={endRef} />
  </div>
);

// ── ChatInput ─────────────────────────────────────────────────────────────────
const ChatInput: React.FC<{
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSend: () => void;
  activePage?: ChatPage;
}> = ({ input, setInput, handleSend, activePage }) => {
  const color = activePage?.color ?? "#7c3aed";
  const wrapRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{
      padding: 12,
      borderTop: "1px solid var(--chat-border, #1e1e2e)",
      flexShrink: 0,
      background: "var(--chat-bg, #0a0a10)",
      transition: "background 0.3s, border-color 0.3s",
    }}>
      <div
        ref={wrapRef}
        style={{
          display: "flex",
          background: "var(--chat-input-wrap-bg, #0d0d18)",
          borderRadius: 10,
          padding: 8,
          gap: 8,
          border: "1px solid var(--chat-input-border, #1e1e2e)",
          transition: "border-color 0.2s, background 0.3s",
        }}
        onFocusCapture={() => {
          if (wrapRef.current) wrapRef.current.style.borderColor = color;
        }}
        onBlurCapture={() => {
          if (wrapRef.current)
            wrapRef.current.style.borderColor = "var(--chat-input-border, #1e1e2e)";
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Ask in "${activePage?.title ?? "this page"}"… (Enter to send, Shift+Enter for newline)`}
          rows={2}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            color: "var(--chat-input-color, #fff)",
            outline: "none",
            resize: "none",
            fontSize: 12,
            lineHeight: 1.55,
            fontFamily: "Space Mono, monospace",
            transition: "color 0.3s",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          style={{
            width: 36, height: 36,
            background: input.trim() ? color : "rgba(128,128,128,0.2)",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            cursor: input.trim() ? "pointer" : "not-allowed",
            alignSelf: "flex-end",
            fontSize: 16,
            transition: "background 0.2s, opacity 0.15s",
            opacity: input.trim() ? 1 : 0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
};

// ── Utility ───────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  } catch {
    return "124,58,237";
  }
}
