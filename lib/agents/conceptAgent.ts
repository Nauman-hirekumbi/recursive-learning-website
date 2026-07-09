import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function conceptAgent(query: string): Promise<string> {
  const prompt = `
Explain the topic in a SHORT, precise paragraph (1 sentences max).

RULES:
- Be concise but information-dense
- Include important technical terms
- Avoid unnecessary explanation or examples
- Make it easy for keyword extraction

Topic: ${query}
`;

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // or "mixtral-8x7b-32768", "gemma2-9b-it"
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }],
  });

  return res.choices[0]?.message?.content?.trim() ?? "";
}