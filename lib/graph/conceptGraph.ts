import { StateGraph, Annotation } from "@langchain/langgraph";
import { conceptAgent } from "../agents/conceptAgent";
import { keywordExtractor } from "../agents/keywordExtractor";
import { keywordAgent } from "../agents/keywordAgent";

// ── State shape flowing through the graph ─────────────────────────────────
const GraphState = Annotation.Root({
  query:         Annotation<string>(),
  parentContext: Annotation<string>(),        // ← the explanation the learner just read
  definition:    Annotation<string>(),
  keywords:      Annotation<string[]>(),
  isKeywordDive: Annotation<boolean>(),       // ← true when user clicked a keyword chip
});

// ── Node 1a: Fresh question — generate a brief explanation ────────────────
const conceptNode = async (state: any) => {
  const definition = await conceptAgent(state.query);
  return { definition };
};

// ── Node 1b: Keyword dive — explain keyword IN context of parent ──────────
// Uses keywordAgent which already receives (keyword, parentContext)
const keywordDiveNode = async (state: any) => {
  const result = await keywordAgent(state.query, state.parentContext);
  // Return both definition AND final keywords — skip keywordExtractor for dives
  return {
    definition: result.definition,
    keywords:   result.keywords,
  };
};

// ── Node 2: Extract clickable keywords from that explanation ──────────────
// Only runs on fresh questions (not keyword dives, which self-extract)
const keywordExtractorNode = async (state: any) => {
  const keywords = await keywordExtractor(state.definition, state.query);
  return { keywords };
};

// ── Router: decide which path to take based on isKeywordDive ─────────────
function routeEntry(state: any): string {
  return state.isKeywordDive ? "keyword_dive" : "concept";
}

// ── Graph ─────────────────────────────────────────────────────────────────
//
//   Fresh question:   concept → extract_keywords → END
//   Keyword click:    keyword_dive → END   (keywords come from keywordAgent itself)
//
export function buildGraph() {
  return new StateGraph(GraphState)
    .addNode("concept",          conceptNode)
    .addNode("keyword_dive",     keywordDiveNode)
    .addNode("extract_keywords", keywordExtractorNode)

    // Entry: branch immediately based on isKeywordDive
    .addConditionalEdges("__start__", routeEntry, {
      concept:      "concept",
      keyword_dive: "keyword_dive",
    })

    // Fresh path: concept explanation → extract keywords
    .addEdge("concept", "extract_keywords")

    .compile();
}