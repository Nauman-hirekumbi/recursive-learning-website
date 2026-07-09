import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
});

export interface ConceptResponse {
  definition: string;
  keywords: string[];
}

async function cleanResponse(prompt: string): Promise<ConceptResponse | null> {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const text = res.choices[0]?.message?.content?.trim() ?? "";
    return JSON.parse(text) as ConceptResponse;
  } catch (err) {
    console.error("AI ERROR:", err);
    return null;
  }
}

export async function generateMainConcept(
  query: string
): Promise<ConceptResponse | null> {
  const prompt = `
You are an expert teacher who builds concept maps.

Step 1:
Write a clear definition (2–3 sentences).

Step 2:
From THAT SAME definition, extract 4–6 important keywords or phrases.
- Keywords MUST be exact words/phrases that appear in the definition
- DO NOT invent or rephrase anything
- Copy them exactly as written in the definition
- Choose meaningful technical or conceptual terms only

Step 3:
Return STRICT valid JSON only.

Format:
{
  "definition": "your explanation here",
  "keywords": ["exact phrase from definition", "another phrase"]
}

Question: ${query}
`;
  return cleanResponse(prompt);
}

export async function explainKeyword(
  keyword: string
): Promise<ConceptResponse | null> {
  const prompt = `
You are an expert teacher. A student is trying to deeply understand the concept:
"${keyword}"

1. Explain it clearly in 2–3 sentences. Use simple language, real examples if helpful.
2. Identify 3–4 sub-concepts that are important building blocks of this concept.
   Pick only terms that are genuinely conceptual — not common words.
3. Return STRICT valid JSON only — no markdown, no extra text.

JSON format:
{
  "definition": "your explanation here",
  "keywords": ["sub-concept1", "sub-concept2", "sub-concept3"]
}
`;
  return cleanResponse(prompt);
}