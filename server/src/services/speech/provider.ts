/**
 * Provider selection for speech (STT + TTS).
 *
 * The stock pipeline is Azure Speech for synthesis (MSFT_SPEECH_KEY) and
 * Groq-hosted Whisper for recognition (GROQ_KEY). Set SPEECH_PROVIDER to:
 *   - "azure"  : the stock pipeline above (default)
 *   - "openai" : any OpenAI-compatible audio API — OpenAI itself, a LiteLLM
 *                proxy, self-hosted faster-whisper / openedai-speech, etc. —
 *                using POST /audio/transcriptions and POST /audio/speech.
 * If SPEECH_PROVIDER is unset, "openai" is used when OPENAI_SPEECH_BASE is
 * configured, otherwise "azure".
 */

export type SpeechProvider = "azure" | "openai";

export const env = (name: string) => {
  const v = process.env[name];
  return v && v !== "XXX" ? v : undefined;
};

export const resolveSpeechProvider = (): SpeechProvider => {
  const explicit = process.env.SPEECH_PROVIDER?.toLowerCase();
  if (explicit === "azure" || explicit === "openai") return explicit;
  return env("OPENAI_SPEECH_BASE") ? "openai" : "azure";
};

export const getOpenaiSpeechBase = (): string => {
  const base = env("OPENAI_SPEECH_BASE");
  if (!base) {
    throw new Error(
      "SPEECH_PROVIDER=openai requires OPENAI_SPEECH_BASE " +
        "(e.g. https://api.openai.com/v1 or a LiteLLM/self-hosted base URL)."
    );
  }
  return base.replace(/\/+$/, "");
};

// Auth header for the OpenAI-compatible endpoint (optional for self-hosted)
export const getOpenaiSpeechHeaders = (): Record<string, string> => {
  const key = env("OPENAI_SPEECH_KEY");
  return key ? { Authorization: `Bearer ${key}` } : {};
};
