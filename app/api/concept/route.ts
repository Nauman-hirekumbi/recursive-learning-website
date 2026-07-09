import { NextRequest, NextResponse } from "next/server";
import { buildGraph } from "@/lib/graph/conceptGraph";

const graph = buildGraph();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const query: string         = (body.query ?? "").trim();
    const parentContext: string = (body.parentContext ?? "").trim();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // If the caller sent a parentContext it's a keyword dive; otherwise fresh
    const isKeywordDive = parentContext.length > 0;

    const result = await graph.invoke({
      query,
      parentContext,
      isKeywordDive,
      definition: "",
      keywords:   [],
    });

    return NextResponse.json({
      mainConcept: {
        definition: result.definition,
        keywords:   result.keywords,
      },
    });
  } catch (err) {
    console.error("/api/concept error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}