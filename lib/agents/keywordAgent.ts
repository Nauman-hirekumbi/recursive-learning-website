import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const KEYWORD_BLOCKLIST = new Set([
  "hardness", "strength", "properties", "applications", "characteristics",
  "features", "advantages", "benefits", "examples", "types", "forms",
  "structure", "structures", "structural", "manufacturing", "superior",
  "primary", "controlled", "various", "different", "diverse", "specific",
  "material", "materials", "substance", "element", "compound", "mixture",
  "alloy", "component", "part", "system", "process", "method", "technique",
  "mechanism", "function", "role", "type", "form", "kind", "way", "stage",
  "reaction", "bond", "energy", "force", "property", "behavior", "effect",
  "factor", "level", "amount", "degree", "value", "result", "output",
  "addition", "combination", "formation", "production", "conversion",
  "transformation", "interaction", "operation", "calculation", "computation",
  "complexity", "efficiency", "accuracy", "performance", "capability",
  "quality", "reliability", "stability", "flexibility", "scalability",
]);

const GENERIC_SUFFIXES = [
  "applications", "application", "properties", "property",
  "characteristics", "characteristic", "advantages", "advantage",
  "features", "feature", "aspects", "aspect", "factors", "factor",
  "methods", "method", "techniques", "technique", "systems", "system",
];

function isTooGeneric(kw: string): boolean {
  const lower = kw.toLowerCase();
  if (KEYWORD_BLOCKLIST.has(lower)) return true;
  if (lower.split(" ").every((w) => w.length <= 4)) return true;
  if (GENERIC_SUFFIXES.some((s) => lower.endsWith(s))) return true;
  return false;
}

export async function keywordAgent(
  keyword: string,
  parentContext: string
): Promise<{
  definition: string;
  keywords: string[];
}> {
  const prompt = `
You are Agent 2 in a learning system.

The learner read:
"${parentContext}"

They clicked: "${keyword}"

GOAL:
Give the NEXT level of understanding — short, sharp, and insightful.

PART 1 — EXPLANATION:
- 2–3 sentences ONLY
- Focus on what "${keyword}" does in the parent context
- Add ONE deeper insight (not already obvious)
- No repetition from parent
- No "X is..." definitions
- No filler

PART 2 — SUB-KEYWORDS (0–2 MAX):
- Must appear in YOUR explanation
- Must be deep concepts (not generic)
- Must go deeper than "${keyword}"
- If none qualify → return []

STRICT OUTPUT (JSON only):
{
  "definition": "short explanation",
  "keywords": ["deep_term"]
}

FINAL CHECK:
- Is this shorter but more insightful?
- Does it feel like "oh, that's the missing piece"?
`;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }, // enforces JSON output natively
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "";

  try {
    const parsed = JSON.parse(text);

    const keywords: string[] = (parsed.keywords ?? [])
      .map((k: string) => k.trim())
      .filter((k: string) => {
        if (k.length <= 2) return false;
        if (k.split(" ").length > 3) return false;
        if (k.toLowerCase() === keyword.toLowerCase()) return false;
        if (isTooGeneric(k)) return false;
        return true;
      });

    return {
      definition: (parsed.definition ?? "").trim(),
      keywords: [...new Set(keywords)].slice(0, 2),
    };
  } catch {
    console.error("keywordAgent parse error:", text);
    return {
      definition: "Could not generate explanation.",
      keywords: [],
    };
  }
}