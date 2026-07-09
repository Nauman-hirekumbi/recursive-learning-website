import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

function isValidKeyword(k: string, originalQuery: string): boolean {
  const lower = k.toLowerCase();

  if (!k || k.length < 6) return false;
  if (k.split(" ").length < 2) return false;
  if (lower === originalQuery.toLowerCase()) return false;

  return true;
}

export async function keywordExtractor(
  definition: string,
  originalQuery: string
): Promise<string[]> {
  const prompt = `
Extract ALL complex technical phrases from the text.

TEXT:
"${definition}"

STRICT RULES:
- ONLY multi-word technical terms
- NO single words
- NO basic/common words (learning, reasoning, decisions, etc.)
- MUST be conceptually deep and expandable
- MUST appear exactly in the text

Return ALL valid keywords (no limit).

OUTPUT JSON:
{
  "keywords": ["term1", "term2", "term3"]
}
`;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const text = res.choices[0]?.message?.content?.trim() ?? "";

  try {
    let keywords: string[] = JSON.parse(text).keywords;

    keywords = keywords
      .map((k) => k.trim())
      .filter((k) => isValidKeyword(k, originalQuery));

    return [...new Set(keywords)];
  } catch (err) {
    console.error("keywordExtractor parse error:", text);
    return [];
  }
}