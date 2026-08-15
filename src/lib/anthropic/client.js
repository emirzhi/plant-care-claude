import Anthropic from "@anthropic-ai/sdk";

let cachedClient = null;

export function getAnthropicClient() {
  if (!cachedClient) {
    cachedClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

// User-configured for this project via ANTHROPIC_AI_MODEL — an explicit
// choice, not a default we picked. Falls back to Sonnet 5 only if unset.
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_AI_MODEL || "claude-sonnet-5";

// Strips accidental markdown fences before JSON.parse — the prompts already
// say "no code fences", this is just a defensive fallback.
export function parseJsonResponse(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Claude did not return valid JSON: ${err.message}`);
  }
}

export function extractText(message) {
  return message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
