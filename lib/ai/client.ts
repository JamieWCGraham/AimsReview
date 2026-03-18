import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  // In Next.js, this will surface during invocation if missing.
  console.warn("OPENAI_API_KEY is not set.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

