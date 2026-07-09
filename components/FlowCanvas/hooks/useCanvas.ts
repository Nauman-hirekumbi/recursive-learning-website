import { useCallback, useEffect, useRef, useState } from "react";
import { RUENode, RUEEdge, DrawnShape, Tool, CANVAS_CENTER } from "../types";

interface UseCanvasProps {
  nodes: RUENode[];
  setNodes: React.Dispatch<React.SetStateAction<RUENode[]>>;
  shapes: DrawnShape[];
  setEdges: React.Dispatch<React.SetStateAction<RUEEdge[]>>;
  setShapes: React.Dispatch<React.SetStateAction<DrawnShape[]>>;
  newId: () => string;
  tool: Tool;
  setTool: (t: Tool) => void;
}

export function useCanvas({
  nodes, setNodes, shapes, setEdges, setShapes, newId, tool, setTool,
}: UseCanvasProps) {

  const [scale, setScale] = useState(1);

 // ✅ AFTER — server and client both start at 0,0, real value set after mount
const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

useEffect(() => {
  setPan({
    x: window.innerWidth  / 2 - CANVAS_CENTER,
    y: window.innerHeight / 2 - CANVAS_CENTER,
  });
}, []);

  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [arrowSourceId, setArrowSourceId] = useState<string | null>(null);

  const isPanning      = useRef(false);
  const panStart       = useRef({ x: 0, y: 0 });
  const panOrigin      = useRef({ x: 0, y: 0 });
  const draggingId     = useRef<string | null>(null);
  // Which collection `draggingId` refers to — a node (text/note/main/…) or
  // a drawn shape (rect/ellipse/diamond). Lets a single drag pipeline move
  // either kind of item.
  const draggingType   = useRef<"node" | "shape" | null>(null);
  const dragOffset     = useRef({ x: 0, y: 0 });
  const drawingShape   = useRef(false);
  const shapeStart     = useRef({ x: 0, y: 0 });
  const shapePreviewId = useRef<string | null>(null);
  const wrapRef        = useRef<HTMLDivElement>(null);

  // Live refs so focusNode animation always reads the latest values
  const panRef   = useRef(pan);
  const scaleRef = useRef(scale);
  useEffect(() => { panRef.current = pan; },   [pan]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Live ref to nodes so focusNode sees fresh node list without stale closure
  const nodesRef = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  // Live ref to shapes so shape-drag handlers always read the latest list
  const shapesRef = useRef(shapes);
  useEffect(() => { shapesRef.current = shapes; }, [shapes]);

  const screenToCanvas = useCallback(
    (sx: number, sy: number) => ({
      x: (sx - panRef.current.x) / scaleRef.current,
      y: (sy - panRef.current.y) / scaleRef.current,
    }),
    []
  );

  const applyZoom = useCallback((factor: number, cx?: number, cy?: number) => {
    const wrap = wrapRef.current!.getBoundingClientRect();
    const ox   = cx ?? wrap.width  / 2;
    const oy   = cy ?? wrap.height / 2;
    const curPan = panRef.current;

    setScale((prev) => {
      const next    = Math.max(0.15, Math.min(4, prev * factor));
      const canvasX = (ox - curPan.x) / prev;
      const canvasY = (oy - curPan.y) / prev;
      setPan({ x: ox - canvasX * next, y: oy - canvasY * next });
      return next;
    });
  }, []);

  // ── fitViewToNodes ────────────────────────────────────────────────────────
  // Accepts an explicit node list so callers (e.g. page-switch restore) can
  // pass the freshly-restored nodes before the `nodes` state prop updates.
  const fitViewToNodes = useCallback((targetNodes: RUENode[]) => {
    if (!targetNodes.length || !wrapRef.current) return;

    const wrap = wrapRef.current.getBoundingClientRect();
    const pad  = 120;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    targetNodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 260);
      maxY = Math.max(maxY, n.y + 160);
    });

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const newScale = Math.min(
      0.95,
      Math.min(
        (wrap.width  - pad * 2) / Math.max(contentW, 1),
        (wrap.height - pad * 2) / Math.max(contentH, 1)
      )
    );

    setPan({
      x: (wrap.width  - contentW * newScale) / 2 - minX * newScale,
      y: (wrap.height - contentH * newScale) / 2 - minY * newScale,
    });
    setScale(newScale);
  }, []);

  // ── fitView — convenience wrapper that uses the current `nodes` state ─────
  const fitView = useCallback(
    () => fitViewToNodes(nodes),
    [nodes, fitViewToNodes]
  );

  // ── focusNode: smoothly pan+zoom so nodeId is centred on screen ───────────
  const focusNode = useCallback((nodeId: string) => {
    if (!wrapRef.current) return;

    const node = nodesRef.current.find((n) => n.id === nodeId);
    if (!node) {
      console.warn("focusNode: node not found", nodeId);
      return;
    }

    const wrap    = wrapRef.current.getBoundingClientRect();
    const el      = document.getElementById(`node-${nodeId}`);
    const nodeW   = el ? el.offsetWidth  : 260;
    const nodeH   = el ? el.offsetHeight : 140;

    const targetScale = Math.min(Math.max(scaleRef.current, 0.65), 0.92);

    const nodeCX   = node.x + nodeW / 2;
    const nodeCY   = node.y + nodeH / 2;
    const targetPX = wrap.width  / 2 - nodeCX * targetScale;
    const targetPY = wrap.height / 2 - nodeCY * targetScale;

    const startPan   = { ...panRef.current };
    const startScale = scaleRef.current;
    const duration   = 420;
    const startTime  = performance.now();

    function ease(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function step(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const e = ease(t);

      setScale(startScale + (targetScale - startScale) * e);
      setPan({
        x: startPan.x + (targetPX - startPan.x) * e,
        y: startPan.y + (targetPY - startPan.y) * e,
      });

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setSelectedId(nodeId);
      }
    }

    requestAnimationFrame(step);
  }, []);

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const onWrapMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (
      target.closest("[data-node]")    ||
      target.closest("[data-shape]")   ||
      target.closest(".chat-modal")    ||
      target.closest(".notes-panel")   ||
      target.closest(".toolbar")       ||
      target.closest(".ctx-menu")      ||
      target.closest(".ui-toggles")
    ) return;

    if (tool === "arrow") {
      setArrowSourceId(null);
      setSelectedId(null);
      return;
    }

    setSelectedId(null);

    if (tool === "hand" || (tool === "select" && e.button !== 2)) {
      isPanning.current  = true;
      panStart.current   = { x: e.clientX, y: e.clientY };
      panOrigin.current  = { ...pan };
      return;
    }

    if (tool === "rect" || tool === "ellipse" || tool === "diamond") {
      drawingShape.current  = true;
      shapeStart.current    = screenToCanvas(e.clientX, e.clientY);
      const pid             = newId();
      shapePreviewId.current = pid;

      setShapes((prev) => [
        ...prev,
        {
          id: pid,
          shapeType: tool as "rect" | "ellipse" | "diamond",
          x: shapeStart.current.x,
          y: shapeStart.current.y,
          width: 0, height: 0,
        },
      ]);
      return;
    }

    if (tool === "text") {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setNodes((prev) => [...prev, { id: newId(), x: pos.x, y: pos.y, type: "text", label: "" }]);
      setTool("select");
      return;
    }

    if (tool === "note") {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setNodes((prev) => [...prev, { id: newId(), x: pos.x, y: pos.y, type: "note", label: "Note..." }]);
      setTool("select");
      return;
    }
  };

  const onNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if ((e.target as HTMLElement).closest("[contenteditable]")) return;

    if (tool === "arrow") {
      if (!arrowSourceId) {
        setArrowSourceId(id); setSelectedId(id);
      } else if (arrowSourceId === id) {
        setArrowSourceId(null); setSelectedId(null);
      } else {
        setEdges((prev) => [
          ...prev,
          { id: newId(), source: arrowSourceId, target: id, color: "amber" },
        ]);
        setArrowSourceId(null); setSelectedId(null);
      }
      return;
    }

    setSelectedId(id);

    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    draggingId.current   = id;
    draggingType.current = "node";
    dragOffset.current   = { x: pos.x - node.x, y: pos.y - node.y };
  };

  // ── Shape selection + dragging ─────────────────────────────────────────────
  // Drawn shapes (rect/ellipse/diamond) previously rendered as inert SVG
  // with pointer-events disabled, so they could never be selected, moved,
  // or deleted. This mirrors onNodeMouseDown so shapes behave the same way
  // nodes do.
  const onShapeMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    // Shapes aren't part of the node graph, so the arrow tool ignores them.
    if (tool === "arrow") return;

    setSelectedId(id);

    const shape = shapesRef.current.find((s) => s.id === id);
    if (!shape) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    draggingId.current   = id;
    draggingType.current = "shape";
    dragOffset.current   = { x: pos.x - shape.x, y: pos.y - shape.y };
  }, [tool, screenToCanvas]);

  const frame = useRef<number | null>(null);

  // ── onMouseMove uses live refs (panRef/scaleRef) instead of closed-over
  // state, so dragging/panning/shape-drawing always reads the latest
  // pan/scale even though this callback is registered once via useEffect. ──
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning.current) {
      setPan({
        x: panOrigin.current.x + (e.clientX - panStart.current.x),
        y: panOrigin.current.y + (e.clientY - panStart.current.y),
      });
    }

    if (draggingId.current) {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const curPan = panRef.current;
        const curScale = scaleRef.current;
        const nx = (e.clientX - curPan.x) / curScale - dragOffset.current.x;
        const ny = (e.clientY - curPan.y) / curScale - dragOffset.current.y;
        if (draggingType.current === "shape") {
          setShapes((prev) =>
            prev.map((s) => s.id === draggingId.current ? { ...s, x: nx, y: ny } : s)
          );
        } else {
          setNodes((prev) =>
            prev.map((n) => n.id === draggingId.current ? { ...n, x: nx, y: ny } : n)
          );
        }
      });
    }

    if (drawingShape.current && shapePreviewId.current) {
      const curPan = panRef.current;
      const curScale = scaleRef.current;
      const cur = {
        x: (e.clientX - curPan.x) / curScale,
        y: (e.clientY - curPan.y) / curScale,
      };
      setShapes((prev) =>
        prev.map((s) =>
          s.id === shapePreviewId.current
            ? {
                ...s,
                x: Math.min(cur.x, shapeStart.current.x),
                y: Math.min(cur.y, shapeStart.current.y),
                width:  Math.abs(cur.x - shapeStart.current.x),
                height: Math.abs(cur.y - shapeStart.current.y),
              }
            : s
        )
      );
    }
  }, [setNodes, setShapes]);

  const onMouseUp = useCallback(() => {
    isPanning.current    = false;
    draggingId.current   = null;
    draggingType.current = null;

    if (drawingShape.current) {
      drawingShape.current = false;
      setShapes((prev) => {
        const sh = prev.find((s) => s.id === shapePreviewId.current);
        if (!sh || sh.width < 10 || sh.height < 10)
          return prev.filter((s) => s.id !== shapePreviewId.current);
        return prev;
      });
      shapePreviewId.current = null;
      setTool("select");
    }
  }, [setShapes, setTool]);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    applyZoom(e.deltaY < 0 ? 1.1 : 0.9, e.clientX, e.clientY);
  }, [applyZoom]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    const wrap = wrapRef.current;
    wrap?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      wrap?.removeEventListener("wheel", onWheel);
    };
  }, [onMouseMove, onMouseUp, onWheel]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArrowSourceId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return {
    scale, pan, selectedId, setSelectedId,
    wrapRef, applyZoom,
    fitView,        // ← uses current `nodes` state
    fitViewToNodes, // ← accepts an explicit node list (for page-switch)
    focusNode,
    screenToCanvas,
    onWrapMouseDown, onNodeMouseDown, onShapeMouseDown,
    arrowSourceId,
  };
}