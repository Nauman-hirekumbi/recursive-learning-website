import Groq from "groq-sdk";

export const model = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!,
});