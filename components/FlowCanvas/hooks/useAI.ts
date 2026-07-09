import { useCallback, useRef, useState } from "react";
import { RUENode, RUEEdge, ChatMessage, CANVAS_CENTER } from "../types";

interface ConceptResponse {
  definition: string;
  keywords:   string[];
}

export interface BreadcrumbEntry {
  label:  string;
  nodeId: string | null;
}

interface UseAIProps {
  nodes:          RUENode[];
  setNodes:       React.Dispatch<React.SetStateAction<RUENode[]>>;
  setEdges:       React.Dispatch<React.SetStateAction<RUEEdge[]>>;
  setShapes:      React.Dispatch<React.SetStateAction<any[]>>;
  newId:          () => string;
  fitView:        () => void;
  fitViewToNodes: (nodes: RUENode[]) => void;
  pageId?:        string;
  appendMessage?: (msg: ChatMessage) => void;
  updateMessage?: (msgId: string, patch: Partial<ChatMessage>) => void;
}

export function useAI({
  nodes,
  setNodes,
  setEdges,
  setShapes,
  newId,
  fitView,
  fitViewToNodes,
  pageId,
  appendMessage,
  updateMessage,
}: UseAIProps) {

  const [_chatMessages, _setChatMessages] = useState<ChatMessage[]>([
    {
      id:   "welcome",
      role: "ai",
      text: "Ask me anything. I'll break it down into key concepts you can explore recursively.",
    },
  ]);

  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([]);
  const branchX = useRef(CANVAS_CENTER - 600);

  // Live ref so async handlers (keyword dive, double-click) always read
  // the latest nodes, even if several clicks fire in quick succession
  // before a render commits the new `nodes` prop.
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Live ref to the breadcrumb trail so a freshly-typed chat question
  // knows which node it should attach to without a stale closure.
  const breadcrumbRef = useRef<BreadcrumbEntry[]>(breadcrumb);
  breadcrumbRef.current = breadcrumb;

  // Live ref tracking which page is *currently* active. `pageId` (the
  // prop) is closed over by each async request at the moment it starts,
  // so comparing it against this live ref after an `await` tells us
  // whether the user has since switched to a different page — used to
  // stop an in-flight request from writing its result into the wrong
  // page's live canvas.
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;

  // ── Message helpers ───────────────────────────────────────────────────────
  const addMsg = (msg: Omit<ChatMessage, "id">) => {
    const full: ChatMessage = { ...msg, id: `m-${Date.now()}-${Math.random()}` };
    if (appendMessage) appendMessage(full);
    else _setChatMessages((prev) => [...prev, full]);
    return full.id;
  };

  const patchMsg = (msgId: string, patch: Partial<ChatMessage>) => {
    if (updateMessage) updateMessage(msgId, patch);
    else _setChatMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, ...patch } : m)));
  };

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchFreshConcept = async (query: string): Promise<ConceptResponse | null> => {
    try {
      const res = await fetch("/api/concept", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      return (await res.json())?.mainConcept ?? null;
    } catch { return null; }
  };

  const fetchKeywordConcept = async (
    keyword: string, parentContext: string
  ): Promise<ConceptResponse | null> => {
    try {
      const res = await fetch("/api/concept", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: keyword, parentContext }),
      });
      return (await res.json())?.mainConcept ?? null;
    } catch { return null; }
  };

  // ── Place main concept node ───────────────────────────────────────────────
  const placeMainConcept = useCallback(
    (query: string, res: ConceptResponse): string => {
      branchX.current = CANVAS_CENTER - 600;
      const mainId = newId();
      const mainNode: RUENode = {
        id: mainId, x: CANVAS_CENTER, y: CANVAS_CENTER,
        type: "main", label: res.definition,
        keywords: res.keywords, usedKeywords: [],
      };

      setNodes([mainNode]);
      setEdges([]);
      setShapes([]);

      // Pass the explicit node list — fitView() closes over stale [] here.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => fitViewToNodes([mainNode]))
      );

      return mainId;
    },
    [newId, setNodes, setEdges, setShapes, fitViewToNodes]
  );

  // ── Send a fresh question ─────────────────────────────────────────────────
  // BUGFIX: this used to unconditionally call placeMainConcept(), which
  // wipes ALL nodes/edges/shapes and drops a single standalone root node —
  // so every typed chat question reset the whole canvas instead of joining
  // the graph the way a keyword-chip click does. Now: if a graph already
  // exists, the question is attached as a new connected node off the
  // current breadcrumb tail (or the graph's root if the tail was deleted).
  // Only a genuinely empty canvas starts a fresh root concept.
  const sendQuestion = async (q: string) => {
    // Capture which page this request belongs to *now*, before any await —
    // used below to detect if the user switches pages while the fetch is
    // still in flight.
    const requestPageId = pageId;

    addMsg({ role: "user", text: q });
    const loadingId = addMsg({ role: "loading", text: "" });

    const currentNodes = nodesRef.current;

    if (currentNodes.length > 0) {
      const tail = breadcrumbRef.current[breadcrumbRef.current.length - 1];
      const tailExists = !!tail?.nodeId && currentNodes.some((n) => n.id === tail.nodeId);
      const rootMain = currentNodes.find((n) => n.type === "main");
      const parentId = tailExists ? tail!.nodeId! : rootMain?.id ?? null;

      if (parentId) {
        const { childNodeId, stale } = await attachConceptNode(parentId, q, loadingId);
        if (!stale) setBreadcrumb((prev) => [...prev, { label: q, nodeId: childNodeId }]);
        return;
      }
    }

    const res = await fetchFreshConcept(q);
    if (!res) { patchMsg(loadingId, { role: "ai", text: "Sorry, couldn't process that." }); return; }

    // BUGFIX: placeMainConcept() wipes the *entire live canvas* and drops
    // a single root node. If the user switched pages while this fetch was
    // in flight, the live canvas now belongs to a different page — running
    // placeMainConcept() here would silently destroy that other page's
    // graph and replace it with this stale question's answer. Skip the
    // canvas mutation in that case; the chat message still lands correctly
    // on the page the question was actually asked on.
    const stale = requestPageId !== undefined && pageIdRef.current !== requestPageId;
    if (stale) {
      patchMsg(loadingId, { role: "ai", text: res.definition, keywords: res.keywords });
      return;
    }

    const mainNodeId = placeMainConcept(q, res);
    setBreadcrumb([{ label: q, nodeId: mainNodeId }]);
    patchMsg(loadingId, { role: "ai", text: res.definition, keywords: res.keywords, nodeId: mainNodeId });
  };

  // ── Shared: fetch a concept for `term` and attach it into the graph as
  // a new child node of `parentId`, wiring up the connecting edge — used
  // by both keyword-chip clicks and typed follow-up chat questions so
  // they behave identically. ──
  const attachConceptNode = async (
    parentId: string,
    term: string,
    loadingId: string,
    opts: { messagePrefix?: string } = {}
  ): Promise<{ childNodeId: string | null; stale: boolean }> => {
    // Capture which page this request belongs to *now*, before the await.
    const requestPageId = pageId;

    const parentNode    = nodesRef.current.find((n) => n.id === parentId);
    const parentContext = parentNode?.label ?? "";

    const res = await fetchKeywordConcept(term, parentContext);
    if (!res) {
      patchMsg(loadingId, { role: "ai", text: "Sorry, couldn't process that." });
      return { childNodeId: null, stale: false };
    }

    // If the user switched pages while this request was in flight, the
    // live canvas now belongs to a different page — attaching the new
    // node here would silently graft this page's concept onto the wrong
    // page's graph. Skip the graph mutation in that case; the chat
    // message itself still lands on the page the request started on.
    const stale = requestPageId !== undefined && pageIdRef.current !== requestPageId;

    let childNodeId: string | null = null;
    // Capture the complete next-nodes array synchronously inside the
    // setNodes updater — the only safe way to get the post-update list
    // without a stale closure after the async fetch.
    let capturedNext: RUENode[] = [];

    if (!stale) {
      setNodes((currentNodes) => {
        const parent = currentNodes.find((n) => n.id === parentId);
        if (!parent) return currentNodes;

        const childId      = newId();
        const siblings     = currentNodes.filter((n) => n.parent === parentId);
        const siblingIndex = siblings.length;
        const offsetY      = (siblingIndex - Math.floor(siblings.length / 2)) * 220;

        const childNode: RUENode = {
          id:           childId,
          x:            parent.x + 340,
          y:            parent.y + offsetY - 110,
          type:         "keyword",
          label:        res.definition,
          keywords:     res.keywords,
          usedKeywords: [],
          parent:       parentId,
        };

        childNodeId = childId;

        setEdges((prev) => [
          ...prev,
          { id: newId(), source: parentId, target: childId, color: "cyan" as const },
        ]);

        capturedNext = [...currentNodes, childNode];
        return capturedNext;
      });

      // Two rAF: React flushes state → browser paints → fitViewToNodes
      // measures DOM dimensions correctly.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (capturedNext.length > 0) fitViewToNodes(capturedNext);
        })
      );
    }

    patchMsg(loadingId, {
      role:     "ai",
      text:     opts.messagePrefix ? `**${opts.messagePrefix}** — ${res.definition}` : res.definition,
      keywords: res.keywords,
      nodeId:   childNodeId ?? undefined,
    });

    return { childNodeId, stale };
  };

  // ── Handle keyword chip click ─────────────────────────────────────────────
  const handleKeywordClick = async (parentId: string | null, kw: string) => {
    // No parent context (e.g. a stray click) — fall back to treating it
    // like a typed question so it still connects into the graph.
    if (!parentId) { await sendQuestion(kw); return; }

    setNodes((prev) =>
      prev.map((n) =>
        n.id === parentId ? { ...n, usedKeywords: [...(n.usedKeywords ?? []), kw] } : n
      )
    );

    const loadingId = addMsg({ role: "loading", text: "" });
    const { childNodeId, stale } = await attachConceptNode(parentId, kw, loadingId, { messagePrefix: kw });

    if (!stale) {
      setTimeout(() => {
        setBreadcrumb((prev) => [...prev, { label: kw, nodeId: childNodeId }]);
      }, 0);
    }
  };

  // ── Double click a node to deep-dive ─────────────────────────────────────
  const onNodeDoubleClick = (id: string) => {
    const n = nodesRef.current.find((x) => x.id === id);
    if (!n) return;
    let term = n.label;
    if (n.type === "sub" && term.includes(": ")) term = term.split(": ")[0].trim();
    term = term.replace(/\n/g, " ").trim().slice(0, 120);
    if (!term || term === "Type here..." || term === "Note...") return;
    handleKeywordClick(id, term);
  };

  return {
    chatMessages: appendMessage ? [] : _chatMessages,
    breadcrumb, setBreadcrumb,
    sendQuestion, handleKeywordClick, onNodeDoubleClick,
  };
}