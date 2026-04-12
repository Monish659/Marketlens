type PersonaLike = {
  demographics?: {
    gender?: string;
    generation?: string;
  };
  location?: {
    country?: string;
  };
};

type VoiceProvider = "openai" | "playht" | "elevenlabs";

export type VoiceProfile = {
  provider: VoiceProvider;
  voiceId: string;
  transcriber: {
    provider: "deepgram";
    model: string;
    language: string;
  };
};

const COUNTRY_TO_LANGUAGE: Record<string, string> = {
  india: "en-IN",
  "united states": "en-US",
  canada: "en-US",
  "united kingdom": "en-GB",
  australia: "en-AU",
  germany: "de-DE",
  france: "fr-FR",
  spain: "es-ES",
  mexico: "es-MX",
  japan: "ja",
  china: "zh",
  korea: "ko",
  brazil: "pt-BR",
};

function normalizeGender(gender?: string) {
  const value = (gender || "").trim().toLowerCase();
  if (value.includes("female") || value === "woman") return "female";
  if (value.includes("male") || value === "man") return "male";
  return "neutral";
}

function inferLanguage(country?: string) {
  const normalized = (country || "").trim().toLowerCase();
  return COUNTRY_TO_LANGUAGE[normalized] || "en-US";
}

function pickOpenAIVoice(gender: "male" | "female" | "neutral") {
  if (gender === "female") return "nova";
  if (gender === "male") return "onyx";
  return "alloy";
}

function pickPlayHTVoice(gender: "male" | "female" | "neutral") {
  if (gender === "female") return "jennifer";
  if (gender === "male") return "matthew";
  return "jennifer";
}

function pickElevenLabsVoice(gender: "male" | "female" | "neutral") {
  // Rachel / Adam defaults.
  if (gender === "female") return "21m00Tcm4TlvDq8ikWAM";
  if (gender === "male") return "pNInz6obpgDQGcFmaJgB";
  return "21m00Tcm4TlvDq8ikWAM";
}

function shouldPreferPremiumVoice() {
  const premiumFlag =
    process.env.VAPI_USE_PREMIUM_VOICE ||
    process.env.NEXT_PUBLIC_VAPI_USE_PREMIUM_VOICE ||
    '';
  return ['1', 'true', 'yes', 'on'].includes(premiumFlag.toLowerCase());
}

export function getVoiceProfile(options?: {
  persona?: PersonaLike | null;
  forcedProvider?: string | null;
  forcedVoiceId?: string | null;
  forcedLanguage?: string | null;
}): VoiceProfile {
  const persona = options?.persona || null;
  const gender = normalizeGender(persona?.demographics?.gender);

  const defaultProvider =
    shouldPreferPremiumVoice() || process.env.VAPI_ELEVENLABS_API_KEY
      ? "elevenlabs"
      : "openai";

  const providerRaw = (options?.forcedProvider || process.env.VAPI_VOICE_PROVIDER || defaultProvider)
    .trim()
    .toLowerCase();
  const provider: VoiceProvider =
    providerRaw === "elevenlabs" || providerRaw === "playht" || providerRaw === "openai"
      ? providerRaw
      : "openai";

  const defaultVoiceId =
    provider === "playht"
      ? pickPlayHTVoice(gender)
      : provider === "elevenlabs"
        ? pickElevenLabsVoice(gender)
        : pickOpenAIVoice(gender);

  const voiceId = options?.forcedVoiceId || process.env.VAPI_VOICE_ID || defaultVoiceId;
  const language =
    options?.forcedLanguage ||
    process.env.VAPI_TRANSCRIBER_LANGUAGE ||
    inferLanguage(persona?.location?.country);

  return {
    provider,
    voiceId,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language,
    },
  };
}
