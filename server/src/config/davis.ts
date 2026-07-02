import { AuthenticatedCompletionModel } from "src/services/completions";
import { LanguageModelKey } from "./deviceSettings";
import { SEXY_PROMPT } from "./sexyMode";

// Max calls to chat completion service in one invocation of davis
export const COMP_MAX_CALLS = 5;
export const COMP_CALLS_EXCEEDED_MSG = `Failed to get a response from Davis in ${COMP_MAX_CALLS} calls.`;

// Spoken to the user when the custom endpoint is unreachable, times out, or
// errors — the device is screenless, so it must hear something speakable
// instead of a hard error.
export const CUSTOM_LLM_UNREACHABLE_MSG =
  "My brain is unreachable right now — try again in a moment.";

type RequireOne<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

// Resolve the full chat-completions URL for the user-supplied custom endpoint.
// Accepts either CUSTOM_LLM_ENDPOINT (full URL) or CUSTOM_LLM_BASE (…/v1).
const customEndpoint = (): string => {
  if (process.env.CUSTOM_LLM_ENDPOINT) return process.env.CUSTOM_LLM_ENDPOINT;
  const base = process.env.CUSTOM_LLM_BASE;
  if (base) return `${base.replace(/\/+$/, "")}/chat/completions`;
  return "https://api.openai.com/v1/chat/completions";
};

export const COMP_MODELS: RequireOne<
  Record<LanguageModelKey, AuthenticatedCompletionModel>,
  "gpt-4o-mini"
> = {
  // Point at any OpenAI-compatible endpoint (LiteLLM, Ollama, OpenRouter, a
  // self-hosted gateway, …) via env. Works for both text and vision.
  custom: {
    endpoint: customEndpoint(),
    name: process.env.CUSTOM_LLM_MODEL ?? "gpt-4o-mini",
    supportsTools: process.env.CUSTOM_LLM_TOOLS !== "false",
    // Empty string (not undefined) when unset — keyless self-hosted gateways
    // (e.g. Ollama) accept it, and it avoids sending "Bearer undefined".
    getKey: () => process.env.CUSTOM_LLM_KEY ?? process.env.OPENAI_KEY ?? "",
  },
  "gpt-4o-mini": {
    endpoint: "https://api.openai.com/v1/chat/completions",
    name: "gpt-4o-mini",
    supportsTools: true,
    getKey: () => process.env.OPENAI_KEY as string,
  },
  "gpt-4o": {
    endpoint: "https://api.openai.com/v1/chat/completions",
    name: "gpt-4o",
    supportsTools: true,
    getKey: () => process.env.OPENAI_KEY as string,
  },
  "grok-2-sexy": {
    endpoint: "https://api.x.ai/v1/chat/completions",
    name: "grok-2",
    supportsTools: false,
    getKey: () => process.env.GROK_KEY as string,
    systemMsgTransform: (_) => SEXY_PROMPT,
  },
};
