"use client";

import { useState, useCallback, useRef } from "react";
import { ChatMessage, RUENode, RUEEdge, DrawnShape } from "../types";

export interface ChatPage {
  id:        string;
  title:     string;
  messages:  ChatMessage[];
  createdAt: number;
  color:     string;
  nodes:     RUENode[];
  edges:     RUEEdge[];
  shapes:    DrawnShape[];
}

const PAGE_COLORS = [
  "#7c3aed", "#0891b2", "#059669", "#d97706",
  "#dc2626", "#db2777", "#4f46e5", "#0d9488",
];

let _pageCounter = 0;
const newPageId  = () => `page-${++_pageCounter}`;

export function useChatPages() {
  const [pages, setPages] = useState<ChatPage[]>([
    {
      id:        "page-0",
      title:     "Research 1",
      messages:  [],
      createdAt: Date.now(),
      color:     PAGE_COLORS[0],
      nodes:     [],
      edges:     [],
      shapes:    [],
    },
  ]);

  const [activePageId, setActivePageId] = useState("page-0");

  // ── Live ref so saveCanvas always sees the latest pages array ─────────────
  // This breaks the stale-closure race between the 300ms auto-save timer
  // and an immediate page-switch save.
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  const getActivePage = useCallback(
    () => pagesRef.current.find((p) => p.id === activePageId) ?? pagesRef.current[0],
    [activePageId]
  );

  // ── Add page ──────────────────────────────────────────────────────────────
  const addPage = useCallback(() => {
    const id       = newPageId();
    const colorIdx = pagesRef.current.length % PAGE_COLORS.length;
    const page: ChatPage = {
      id,
      title:     `Research ${pagesRef.current.length + 1}`,
      messages:  [],
      createdAt: Date.now(),
      color:     PAGE_COLORS[colorIdx],
      nodes:     [],
      edges:     [],
      shapes:    [],
    };
    setPages((prev) => [...prev, page]);
    setActivePageId(id);
    return id;
  }, []);

  // ── Delete page ───────────────────────────────────────────────────────────
  const deletePage = useCallback((id: string) => {
    setPages((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
    setActivePageId((prev) => {
      if (prev !== id) return prev;
      const remaining = pagesRef.current.filter((p) => p.id !== id);
      return remaining[remaining.length - 1]?.id ?? pagesRef.current[0].id;
    });
  }, []);

  // ── Rename page ───────────────────────────────────────────────────────────
  const renamePage = useCallback((id: string, title: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
  }, []);

  // ── Messages ──────────────────────────────────────────────────────────────
  const appendMessage = useCallback((pageId: string, msg: ChatMessage) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, messages: [...p.messages, msg] } : p
      )
    );
  }, []);

  const updateMessage = useCallback((pageId: string, msgId: string, patch: Partial<ChatMessage>) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? { ...p, messages: p.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)) }
          : p
      )
    );
  }, []);

  // ── Clear all messages for a page (used by the "Clear Chat" button, and
  // also fired automatically when the canvas is cleared so the chat and
  // the graph it refers to never fall out of sync). ──
  const clearMessages = useCallback((pageId: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, messages: [] } : p))
    );
  }, []);

  // ── Canvas persistence ────────────────────────────────────────────────────
  // Uses a functional updater so it always writes into the *current* pages
  // array regardless of when it is called — no stale closure possible.
  const saveCanvas = useCallback((
    pageId: string,
    nodes:  RUENode[],
    edges:  RUEEdge[],
    shapes: DrawnShape[]
  ) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, nodes, edges, shapes } : p
      )
    );
  }, []);

  // ── Read canvas for a page (synchronous, uses live ref) ───────────────────
  // Used by FlowCanvas to read restored state without waiting for a render.
  const readCanvas = useCallback((pageId: string) => {
    const page = pagesRef.current.find((p) => p.id === pageId);
    return {
      nodes:  page?.nodes  ?? [] as RUENode[],
      edges:  page?.edges  ?? [] as RUEEdge[],
      shapes: page?.shapes ?? [] as DrawnShape[],
    };
  }, []);

  return {
    pages,
    activePageId,
    setActivePageId,
    getActivePage,
    addPage,
    deletePage,
    renamePage,
    appendMessage,
    updateMessage,
    clearMessages,
    saveCanvas,
    readCanvas,
  };
}