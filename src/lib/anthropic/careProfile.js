import {
  getAnthropicClient,
  ANTHROPIC_MODEL,
  parseJsonResponse,
  extractText,
} from "@/lib/anthropic/client";
import { CARE_PROFILE_PROMPT } from "@/lib/anthropic/prompts";
import { isLightLevel, isHumidityLevel } from "@/lib/constants/care-profile-enums";

function validateCareProfile(profile) {
  const isNullableInt = (v) => v === null || Number.isInteger(v);

  if (
    !profile?.watering ||
    !Number.isInteger(profile.watering.interval_days_summer) ||
    !Number.isInteger(profile.watering.interval_days_winter)
  ) {
    throw new Error("Care profile missing valid watering intervals.");
  }
  if (
    !profile.fertilizing ||
    !Number.isInteger(profile.fertilizing.interval_days_growing_season) ||
    !isNullableInt(profile.fertilizing.interval_days_dormant)
  ) {
    throw new Error("Care profile missing valid fertilizing intervals.");
  }
  if (!profile.mist || !isNullableInt(profile.mist.interval_days)) {
    throw new Error("Care profile missing valid mist interval.");
  }
  if (!profile.light || !isLightLevel(profile.light.level)) {
    throw new Error("Care profile missing valid light level.");
  }
  if (!profile.humidity || !isHumidityLevel(profile.humidity.level)) {
    throw new Error("Care profile missing valid humidity level.");
  }
  if (
    !Array.isArray(profile.temperature_range_c) ||
    profile.temperature_range_c.length !== 2
  ) {
    throw new Error("Care profile missing valid temperature_range_c.");
  }
  if (!profile.toxicity || typeof profile.toxicity.pets !== "boolean") {
    throw new Error("Care profile missing valid toxicity.pets.");
  }
  if (!Array.isArray(profile.common_problems)) {
    throw new Error("Care profile missing common_problems.");
  }
  if (!Number.isInteger(profile.rotation_days)) {
    throw new Error("Care profile missing valid rotation_days.");
  }
  return profile;
}

export async function generateCareProfile({ scientificName, commonName }) {
  const client = getAnthropicClient();

  const speciesLabel = commonName
    ? `${scientificName} (${commonName})`
    : scientificName;

  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1536,
    thinking: { type: "disabled" },
    system: CARE_PROFILE_PROMPT,
    messages: [{ role: "user", content: `Species: ${speciesLabel}` }],
  });

  const parsed = parseJsonResponse(extractText(message));
  return validateCareProfile(parsed);
}
