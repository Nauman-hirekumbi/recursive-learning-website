"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  RUENode,
  RUEEdge,
  DrawnShape,
  Tool,
  CANVAS_SIZE,
  EDGE_COLOR_MAP,
} from "./types";
import { NodeCard }     from "./NodeCard";
import { Toolbar }      from "./Toolbar";
import { ChatModal }    from "./ChatModal";
import { NotesPanel }   from "./NotesPanel";
import { ContextMenu }  from "./ContextMenu";
import { SvgDefs }      from "./ui";
import { useCanvas }    from "./hooks/useCanvas";
import { useAI }        from "./hooks/useAI";
import { useChatPages } from "./hooks/useChatPages";
import { layoutTree, NODE_W } from "./hooks/index";
import { useTheme, ThemeProvider } from "./Themecontext";
import { downloadNotesAsPdf } from "./utils/exportNotes";

// ── CSS variables injected globally ──────────────────────────────────────────
const THEME_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; }

  :root, [data-theme="dark"] {
    --bg-canvas:        #0a0a0f;
    --bg-surface:       #0e0e18;
    --bg-surface-2:     #161620;
    --bg-overlay:       rgba(10,10,15,0.85);
    --border-subtle:    #2a2a42;
    --border-mid:       #3a3a5a;
    --text-primary:     #e2e8f0;
    --text-secondary:   #94a3b8;
    --text-muted:       #64748b;
    --text-faint:       #475569;
    --accent:           #7c3aed;
    --accent-glow:      rgba(124,58,237,0.18);
    --accent-border:    rgba(124,58,237,0.45);
    --accent-text:      #c4b5fd;
    --grid-line:        #2a2a42;
    --grid-opacity:     0.4;
    --node-bg:          #0e0e18;
    --toolbar-bg:       rgba(10,10,15,0.9);
    --status-bg:        rgba(10,10,15,0.85);
    --toggle-bg:        #161620;
    --toggle-border:    #2a2a42;
    --toggle-icon:      #94a3b8;
    --toggle-hover-bg:  #1e1e2d;
    --shadow-modal:     0 20px 50px rgba(0,0,0,0.7);
    --shape-rect-stroke:   #06b6d4;
    --shape-rect-fill:     rgba(6,182,212,0.06);
    --shape-ellipse-stroke:#f59e0b;
    --shape-ellipse-fill:  rgba(245,158,11,0.06);
    --shape-diamond-stroke:#10b981;
    --shape-diamond-fill:  rgba(16,185,129,0.06);
  }

  [data-theme="light"] {
    --bg-canvas:        #f5f5fa;
    --bg-surface:       #ffffff;
    --bg-surface-2:     #f0f0f8;
    --bg-overlay:       rgba(245,245,250,0.92);
    --border-subtle:    #d8d8e8;
    --border-mid:       #c0c0d8;
    --text-primary:     #1a1a2e;
    --text-secondary:   #4a4a6a;
    --text-muted:       #6b6b8a;
    --text-faint:       #9090a8;
    --accent:           #6d28d9;
    --accent-glow:      rgba(109,40,217,0.10);
    --accent-border:    rgba(109,40,217,0.35);
    --accent-text:      #6d28d9;
    --grid-line:        #c8c8dc;
    --grid-opacity:     0.6;
    --node-bg:          #ffffff;
    --toolbar-bg:       rgba(255,255,255,0.95);
    --status-bg:        rgba(245,245,250,0.92);
    --toggle-bg:        #ffffff;
    --toggle-border:    #d8d8e8;
    --toggle-icon:      #4a4a6a;
    --toggle-hover-bg:  #f0f0f8;
    --shadow-modal:     0 20px 50px rgba(0,0,0,0.12);
    --shape-rect-stroke:   #0891b2;
    --shape-rect-fill:     rgba(8,145,178,0.06);
    --shape-ellipse-stroke:#d97706;
    --shape-ellipse-fill:  rgba(217,119,6,0.06);
    --shape-diamond-stroke:#059669;
    --shape-diamond-fill:  rgba(5,150,105,0.06);
  }
`;

// ── Inner canvas (consumes theme) ─────────────────────────────────────────────
function FlowCanvasInner() {
  const { isDark, toggleTheme } = useTheme();

  const [tool, setToolState] = useState<Tool>("select");
  const [nodes, setNodes]    = useState<RUENode[]>([]);
  const [edges, setEdges]    = useState<RUEEdge[]>([]);
  const [shapes, setShapes]  = useState<DrawnShape[]>([]);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; targetId: string } | null>(null);
  const [notes, setNotes]    = useState<{ id: string; text: string }[]>([]);
  const [chatVisible, setChatVisible]   = useState(false);
  const [notesVisible, setNotesVisible] = useState(true);
  const [layoutDirection, setLayoutDirection] = useState<"horizontal" | "vertical">("horizontal");

  const nodeCounter = useRef(0);
  const newId   = useCallback(() => `n${++nodeCounter.current}`, []);
  const setTool = (t: Tool) => setToolState(t);

  const {
    pages, activePageId, setActivePageId, getActivePage,
    addPage, deletePage, renamePage,
    appendMessage, updateMessage, clearMessages, saveCanvas, readCanvas,
  } = useChatPages();

  const nodesRef  = useRef(nodes);
  const edgesRef  = useRef(edges);
  const shapesRef = useRef(shapes);
  nodesRef.current  = nodes;
  edgesRef.current  = edges;
  shapesRef.current = shapes;

  const activePageIdRef = useRef(activePageId);
  activePageIdRef.current = activePageId;

  const {
    scale, pan, selectedId, setSelectedId,
    wrapRef, applyZoom, fitView, fitViewToNodes, focusNode,
    screenToCanvas, onWrapMouseDown, onNodeMouseDown, onShapeMouseDown,
  } = useCanvas({ nodes, setNodes, shapes, setEdges, setShapes, newId, tool, setTool });

  const activePage = getActivePage();

  const {
    breadcrumb, setBreadcrumb,
    sendQuestion, handleKeywordClick, onNodeDoubleClick,
  } = useAI({
    nodes, setNodes, setEdges, setShapes, newId,
    fitView, fitViewToNodes,
    pageId:        activePageId,
    appendMessage: (msg)          => appendMessage(activePageId, msg),
    updateMessage: (msgId, patch) => updateMessage(activePageId, msgId, patch),
  });

  const handleSelectPage = useCallback(
    (newPageId: string) => {
      if (newPageId === activePageIdRef.current) return;
      saveCanvas(activePageIdRef.current, nodesRef.current, edgesRef.current, shapesRef.current);
      const { nodes: n, edges: e, shapes: s } = readCanvas(newPageId);
      setNodes(n); setEdges(e); setShapes(s);
      setSelectedId(null);
      setBreadcrumb([]);
      setActivePageId(newPageId);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => { if (n.length > 0) fitViewToNodes(n); })
      );
    },
    [saveCanvas, readCanvas, setActivePageId, fitViewToNodes, setSelectedId, setBreadcrumb],
  );

  // ── "+ New Page" must (1) persist whatever is currently on the canvas
  // into the page being left, then (2) reset the live canvas state to
  // empty for the freshly created page. Previously this called the raw
  // `addPage()` directly, which only touched the pages array and left
  // the old page's nodes/edges/shapes rendered under the new page's
  // identity until the next autosave silently copied them over. ──
  const handleAddPage = useCallback(() => {
    saveCanvas(activePageIdRef.current, nodesRef.current, edgesRef.current, shapesRef.current);
    addPage();
    setNodes([]); setEdges([]); setShapes([]);
    setSelectedId(null);
    setBreadcrumb([]);
  }, [saveCanvas, addPage, setSelectedId, setBreadcrumb]);

  // ── Deleting the *active* page must load whichever page becomes
  // active next, otherwise the canvas keeps showing the deleted page's
  // (stale) nodes attached to a new activePageId.
  //
  // Message-reference safety: deletePage() removes the entire page object
  // — including its `messages` array — from the `pages` state in one shot,
  // so there is no separate "chat messages" store that could keep a
  // reference to the deleted page's conversation around. Once the page is
  // gone, its messages are gone with it; nothing else in state can point
  // at them. ──
  const handleDeletePage = useCallback(
    (id: string) => {
      const wasActive = id === activePageIdRef.current;
      deletePage(id);
      if (wasActive) {
        // deletePage updates activePageId synchronously inside its own
        // setState; give React a tick, then resync the live canvas from
        // whatever page ends up active.
        requestAnimationFrame(() => {
          const remaining = pages.filter((p) => p.id !== id);
          const nextId = remaining[remaining.length - 1]?.id ?? remaining[0]?.id;
          if (!nextId) return;
          const { nodes: n, edges: e, shapes: s } = readCanvas(nextId);
          setNodes(n); setEdges(e); setShapes(s);
          setSelectedId(null);
          setBreadcrumb([]);
        });
      }
    },
    [deletePage, pages, readCanvas, setSelectedId, setBreadcrumb],
  );

  const onLabelChange = useCallback((id: string, newLabel: string) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, label: newLabel } : n));
  }, []);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveCanvas(activePageId, nodes, edges, shapes);
    }, 300);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [nodes, edges, shapes, activePageId, saveCanvas]);

  const domHeights = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    nodes.forEach((n) => {
      const el = document.getElementById(`node-${n.id}`);
      if (el) {
        const h = Math.round(el.getBoundingClientRect().height);
        if (h > 20) domHeights.current.set(n.id, h);
      }
    });
  }, [nodes]);

  const nodesSerialized = useMemo(
    () => nodes.map((n) => `${n.id}-${n.label?.length || 0}`).join(","),
    [nodes]
  );

  useEffect(() => {
    if (nodes.length <= 1) return;
    const timer = setTimeout(() => {
      setNodes((prev) => {
        if (prev.length <= 1) return prev;
        const next = layoutTree(prev, domHeights.current, { direction: layoutDirection, edges });
        const hasMoved = next.some((n, i) =>
          Math.abs(n.x - (prev[i]?.x || 0)) > 4 ||
          Math.abs(n.y - (prev[i]?.y || 0)) > 4
        );
        if (!hasMoved) return prev;
        requestAnimationFrame(() => requestAnimationFrame(() => fitViewToNodes(next)));
        return next;
      });
    }, 90);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesSerialized, layoutDirection, fitViewToNodes]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement;
      if (
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA" ||
        active?.getAttribute("contenteditable")
      ) return;

      const map: Record<string, Tool> = {
        v: "select", h: "hand", r: "rect", e: "ellipse",
        d: "diamond", a: "arrow", t: "text", n: "note",
      };
      if (map[e.key.toLowerCase()]) { setTool(map[e.key.toLowerCase()]); return; }

      if (e.key === "+" || e.key === "=") applyZoom(1.2);
      if (e.key === "-")                  applyZoom(0.83);
      if (e.key.toLowerCase() === "f")    fitView();

      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const isShape = shapesRef.current.some((s) => s.id === selectedId);
        if (isShape) {
          setShapes((prev) => prev.filter((s) => s.id !== selectedId));
        } else {
          setNodes((prev) => prev.filter((n) => n.id !== selectedId));
          setEdges((prev) => prev.filter((ed) => ed.source !== selectedId && ed.target !== selectedId));
        }
        setSelectedId(null);
      }
      if (e.key === "Escape") { setCtxMenu(null); setTool("select"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [applyZoom, fitView, selectedId, setSelectedId, setTool]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, RUENode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const getDims = useCallback((node: RUENode) => ({
    w: NODE_W[node.type] ?? 260,
    h: domHeights.current.get(node.id) ?? 140,
  }), []);

  const getEdgePath = useCallback((edge: RUEEdge): string | null => {
    const s = nodeMap.get(edge.source);
    const t = nodeMap.get(edge.target);
    if (!s || !t) return null;
    const sd = getDims(s);
    const td = getDims(t);
    if (layoutDirection === "vertical") {
      const sx = s.x + sd.w / 2, sy = s.y + sd.h;
      const tx = t.x + td.w / 2, ty = t.y - 1;
      const midY = (sy + ty) / 2;
      return `M ${sx},${sy} C ${sx},${midY} ${tx},${midY} ${tx},${ty}`;
    } else {
      const sx = s.x + sd.w, sy = s.y + sd.h / 2;
      const tx = t.x,        ty = t.y + td.h / 2;
      const midX = (sx + tx) / 2;
      return `M ${sx},${sy} C ${midX},${sy} ${midX},${ty} ${tx},${ty}`;
    }
  }, [nodeMap, getDims, layoutDirection]);

  const handleBreadcrumbClick = useCallback(
    (entry: { label: string; nodeId: string | null }) => {
      if (entry.nodeId) focusNode(entry.nodeId);
    },
    [focusNode]
  );

  const placeNoteOnCanvas = (text: string) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const pos  = screenToCanvas(rect.width / 2, rect.height / 2);
    const newNode: RUENode = {
      id: newId(), x: pos.x - 110, y: pos.y - 40, type: "note", label: text,
    };
    setNodes((prev) =>
      layoutTree([...prev, newNode], domHeights.current, { direction: layoutDirection, edges })
    );
  };

  // ── Download the full conversation (every research page) plus quick
  // notes as one professionally formatted, correctly paginated PDF,
  // whenever the user wants. ──
  const handleDownloadNotes = useCallback(() => {
    downloadNotesAsPdf(pages, notes);
  }, [pages, notes]);

  // ── Clear canvas + chat together ──────────────────────────────────────────
  // The canvas graph and this page's chat conversation describe the same
  // exploration — a keyword node only exists because a chat message asked
  // about it, and a chat message only makes sense next to the node it
  // produced. Clearing just one used to leave the other behind (a graph
  // with no explanation, or a chat with dead "explore" links pointing at
  // nodes that no longer exist). Whichever one you clear, clear both.
  const clearCanvasAndChat = useCallback(() => {
    setNodes([]); setEdges([]); setShapes([]);
    saveCanvas(activePageId, [], [], []);
    clearMessages(activePageId);
    setBreadcrumb([]);
    setSelectedId(null);
  }, [activePageId, saveCanvas, clearMessages, setNodes, setEdges, setShapes, setBreadcrumb, setSelectedId]);

  const cursorMap: Record<Tool, string> = {
    select: "default", hand: "grab", rect: "crosshair",
    ellipse: "crosshair", diamond: "crosshair", arrow: "crosshair",
    text: "text", note: "cell",
  };

  const TOOLBAR_BOTTOM = 62;

  return (
    <div style={{
      width: "100vw", height: "100vh",
      background: "var(--bg-canvas)",
      overflow: "hidden", position: "relative",
      fontFamily: "'Space Mono', monospace",
      transition: "background 0.3s",
    }}>
      <style>{THEME_STYLES}</style>

      {/* Toolbar now owns the theme toggle — no separate ThemeToggle needed */}
      <Toolbar
        tool={tool} setTool={setTool} applyZoom={applyZoom} fitView={fitView}
        onClear={() => {
          if (window.confirm("Clear canvas? This will also clear this page's chat conversation.")) {
            clearCanvasAndChat();
          }
        }}
        onDownloadNotes={handleDownloadNotes}
        chatVisible={chatVisible} setChatVisible={setChatVisible}
        notesVisible={notesVisible} setNotesVisible={setNotesVisible}
        layoutDirection={layoutDirection} setLayoutDirection={setLayoutDirection}
        toggleTheme={toggleTheme}
        isDark={isDark}
      />

      {/* ── Breadcrumb ── */}
      {breadcrumb.length > 0 && (
        <div style={{
          position: "fixed", top: TOOLBAR_BOTTOM + 14, left: "50%",
          transform: "translateX(-50%)", display: "flex", alignItems: "center",
          gap: 6, zIndex: 101, fontSize: 10, color: "var(--text-muted)",
          maxWidth: "80vw", flexWrap: "wrap", justifyContent: "center",
          pointerEvents: "auto",
        }}>
          {breadcrumb.map((entry, i) => {
            const isCurrent = i === breadcrumb.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: "var(--border-mid)" }}>›</span>}
                <span
                  title={entry.nodeId ? "Click to focus this node" : entry.label}
                  style={{
                    cursor: "pointer", padding: "2px 10px", borderRadius: 4,
                    background: isCurrent ? "var(--accent-glow)" : "rgba(128,128,128,0.06)",
                    border: `1px solid ${isCurrent ? "var(--accent-border)" : "transparent"}`,
                    color: isCurrent ? "var(--accent-text)" : "var(--text-muted)",
                    transition: "all 0.15s", whiteSpace: "nowrap",
                    backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                  }}
                  onClick={() => handleBreadcrumbClick(entry)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--accent-glow)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isCurrent
                      ? "var(--accent-glow)" : "rgba(128,128,128,0.06)";
                    (e.currentTarget as HTMLElement).style.color = isCurrent
                      ? "var(--accent-text)" : "var(--text-muted)";
                  }}
                >
                  {entry.label.length > 24 ? entry.label.slice(0, 24) + "…" : entry.label}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Grid ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `
          linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
          linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)
        `,
        backgroundSize: `${24 * scale}px ${24 * scale}px`,
        backgroundPosition: `${(pan.x * 0.5) % (24 * scale)}px ${(pan.y * 0.5) % (24 * scale)}px`,
        opacity: "var(--grid-opacity)" as any,
        transition: "opacity 0.3s",
      }} />

      {/* ── Canvas ── */}
      <div
        ref={wrapRef}
        style={{ position: "absolute", inset: 0, cursor: cursorMap[tool], overflow: "hidden", zIndex: 1 }}
        onMouseDown={onWrapMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div style={{
          position: "absolute", width: CANVAS_SIZE, height: CANVAS_SIZE,
          transformOrigin: "0 0",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        }}>
          <svg style={{
            position: "absolute", left: 0, top: 0,
            width: CANVAS_SIZE, height: CANVAS_SIZE,
            overflow: "visible",
          }}>
            <SvgDefs />
            {edges.map((edge) => {
              const d = getEdgePath(edge);
              if (!d) return null;
              const color = edge.color ?? "purple";
              return (
                <path
                  key={edge.id} d={d} fill="none"
                  stroke={EDGE_COLOR_MAP[color]}
                  strokeWidth={1.8} strokeOpacity={0.8}
                  markerEnd={`url(#arrow-${color})`}
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: "none" }}
                />
              );
            })}

            {/* ── Drawn shapes rendered as true SVG so the diamond's
                 bounding box matches its visual extent (no CSS rotate
                 distortion, no hit-area mismatch). Shapes are fully
                 interactive: click to select, drag to move, right-click
                 or Delete/Backspace to remove — same as any node. ── */}
            {shapes.map((sh) => {
              const isSelected = selectedId === sh.id;
              const strokeVar =
                sh.shapeType === "rect" ? "var(--shape-rect-stroke)"
                : sh.shapeType === "ellipse" ? "var(--shape-ellipse-stroke)"
                : "var(--shape-diamond-stroke)";
              const fillVar =
                sh.shapeType === "rect" ? "var(--shape-rect-fill)"
                : sh.shapeType === "ellipse" ? "var(--shape-ellipse-fill)"
                : "var(--shape-diamond-fill)";

              const interactionProps = {
                "data-shape": sh.id,
                onMouseDown: (e: React.MouseEvent) => onShapeMouseDown(e, sh.id),
                onContextMenu: (e: React.MouseEvent) => {
                  e.preventDefault(); e.stopPropagation();
                  setCtxMenu({ x: e.clientX, y: e.clientY, targetId: sh.id });
                },
                style: {
                  cursor: tool === "select" ? "move" : cursorMap[tool],
                  pointerEvents: "auto" as const,
                },
              };

              const selectionOutline = isSelected && (
                <rect
                  key={`${sh.id}-selection`}
                  x={sh.x - 6} y={sh.y - 6}
                  width={sh.width + 12} height={sh.height + 12}
                  rx={10} ry={10}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: "none" }}
                />
              );

              if (sh.shapeType === "rect") {
                return (
                  <React.Fragment key={sh.id}>
                    <rect
                      x={sh.x} y={sh.y} width={sh.width} height={sh.height}
                      rx={8} ry={8}
                      stroke={strokeVar} fill={fillVar} strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      {...interactionProps}
                    />
                    {selectionOutline}
                  </React.Fragment>
                );
              }
              if (sh.shapeType === "ellipse") {
                return (
                  <React.Fragment key={sh.id}>
                    <ellipse
                      cx={sh.x + sh.width / 2} cy={sh.y + sh.height / 2}
                      rx={sh.width / 2} ry={sh.height / 2}
                      stroke={strokeVar} fill={fillVar} strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                      {...interactionProps}
                    />
                    {selectionOutline}
                  </React.Fragment>
                );
              }
              // diamond — true rhombus inscribed in the bounding box,
              // not a rotated square, so width/height map 1:1 to the
              // visual extent of the shape.
              const cx = sh.x + sh.width / 2;
              const cy = sh.y + sh.height / 2;
              const points = [
                `${cx},${sh.y}`,
                `${sh.x + sh.width},${cy}`,
                `${cx},${sh.y + sh.height}`,
                `${sh.x},${cy}`,
              ].join(" ");
              return (
                <React.Fragment key={sh.id}>
                  <polygon
                    points={points}
                    stroke={strokeVar} fill={fillVar} strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                    {...interactionProps}
                  />
                  {selectionOutline}
                </React.Fragment>
              );
            })}
          </svg>

          {nodes.map((node) => (
            <NodeCard
              key={node.id} node={node} selected={selectedId === node.id}
              onMouseDown={onNodeMouseDown}
              onContextMenu={(e, id) => {
                e.preventDefault(); e.stopPropagation();
                setCtxMenu({ x: e.clientX, y: e.clientY, targetId: id });
              }}
              onKeywordClick={handleKeywordClick}
              onDoubleClick={onNodeDoubleClick}
              onLabelChange={onLabelChange}
            />
          ))}
        </div>
      </div>

      {/* ── Chat Modal ── */}
      <ChatModal
        visible={chatVisible} setVisible={setChatVisible}
        messages={activePage?.messages ?? []}
        onSend={sendQuestion} onKeywordClick={handleKeywordClick}
        onClearChat={clearCanvasAndChat}
        pages={pages} activePageId={activePageId}
        onSelectPage={handleSelectPage} onAddPage={handleAddPage}
        onDeletePage={handleDeletePage} onRenamePage={renamePage}
      />

      {notesVisible && (
        <NotesPanel
          notes={notes}
          onAdd={(text) => setNotes((prev) => [...prev, { id: newId(), text }])}
          onPlace={placeNoteOnCanvas}
          onDelete={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
          onClearAll={() => setNotes([])}
        />
      )}

      {ctxMenu && (
        <ContextMenu
          ctxMenu={ctxMenu} nodes={nodes} shapes={shapes} newId={newId}
          onClose={() => setCtxMenu(null)}
          onExplore={(id, label) => handleKeywordClick(id, label)}
          onAddToNotes={(note) => setNotes((prev) => [...prev, note])}
          onDuplicate={(node) => {
            const dupId = newId();
            const dup: RUENode = { ...node, id: dupId, x: node.x + 40, y: node.y + 30, parent: node.parent };
            setNodes((prev) =>
              layoutTree([...prev, dup], domHeights.current, { direction: layoutDirection, edges })
            );
          }}
          onDelete={(id) => {
            setNodes((prev) => prev.filter((n) => n.id !== id));
            setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
          }}
          onDuplicateShape={(shape) => {
            const dupId = newId();
            setShapes((prev) => [
              ...prev,
              { ...shape, id: dupId, x: shape.x + 30, y: shape.y + 30 },
            ]);
            setSelectedId(dupId);
          }}
          onDeleteShape={(id) => setShapes((prev) => prev.filter((s) => s.id !== id))}
        />
      )}

      {/* ── Status bar ── */}
      <div style={{
        position: "fixed", bottom: 12, left: "50%", transform: "translateX(-50%)",
        fontSize: 11, color: "var(--text-muted)", padding: "6px 18px",
        background: "var(--status-bg)",
        borderRadius: 8, backdropFilter: "blur(8px)", zIndex: 50,
        border: "1px solid var(--border-subtle)",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        {tool} • {nodes.length} nodes • {edges.length} edges • {Math.round(scale * 100)}% •
        Layout: {layoutDirection === "horizontal" ? "→ Horizontal" : "↓ Vertical"} •
        Page: {activePage?.title ?? "—"}
      </div>
    </div>
  );
}

// ── Default export wraps with ThemeProvider ───────────────────────────────────
export default function FlowCanvas() {
  return (
    <ThemeProvider>
      <FlowCanvasInner />
    </ThemeProvider>
  );
}