import {
  getAnthropicClient,
  ANTHROPIC_MODEL,
  parseJsonResponse,
  extractText,
} from "@/lib/anthropic/client";
import { IDENTIFY_PROMPT } from "@/lib/anthropic/prompts";
import { isPlantType } from "@/lib/constants/plant-types";

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function isSupportedImageType(mediaType) {
  return ALLOWED_MEDIA_TYPES.has(mediaType);
}

function isCandidate(value) {
  return (
    value &&
    typeof value.common_name === "string" &&
    typeof value.scientific_name === "string" &&
    typeof value.confidence === "number" &&
    isPlantType(value.type)
  );
}

function validateIdentifyResult(result) {
  if (!result || !isCandidate(result.primary)) {
    throw new Error("Identification response missing a valid primary candidate.");
  }
  if (!Array.isArray(result.alternatives) || !result.alternatives.every(isCandidate)) {
    throw new Error("Identification response has invalid alternatives.");
  }
  if (!Array.isArray(result.visible_health_issues)) {
    result.visible_health_issues = [];
  }
  return result;
}

export async function identifySpecies({ base64, mediaType }) {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    thinking: { type: "disabled" },
    system: IDENTIFY_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: "Identify this plant." },
        ],
      },
    ],
  });

  const parsed = parseJsonResponse(extractText(message));
  return validateIdentifyResult(parsed);
}
