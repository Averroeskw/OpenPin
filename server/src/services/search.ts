import axios from "axios";

/**
 * Provider-agnostic web search.
 *
 * Bing Web Search is being retired and new Azure keys can no longer be created,
 * so the provider is now selectable. Set SEARCH_PROVIDER to one of:
 *   - "brave"   : Brave Search API (needs BRAVE_KEY)
 *   - "searxng" : self-hosted SearXNG instance (needs SEARXNG_BASE_URL, no key)
 *   - "bing"    : legacy Bing Web Search (needs BING_KEY)
 * If SEARCH_PROVIDER is unset, the first provider with usable config is chosen,
 * preferring self-hosted SearXNG, then Brave, then Bing.
 */

export interface SearchResult {
  title: string;
  snippet: string;
}

type SearchProvider = "brave" | "searxng" | "bing";

const env = (name: string) => {
  const v = process.env[name];
  return v && v !== "XXX" ? v : undefined;
};

const REQUIRED_ENV: Record<SearchProvider, string> = {
  brave: "BRAVE_KEY",
  searxng: "SEARXNG_BASE_URL",
  bing: "BING_KEY",
};

const resolveProvider = (): SearchProvider => {
  const explicit = process.env.SEARCH_PROVIDER?.toLowerCase();
  if (explicit) {
    if (explicit !== "brave" && explicit !== "searxng" && explicit !== "bing") {
      throw new Error(
        `Unknown SEARCH_PROVIDER "${explicit}" — use brave, searxng, or bing.`
      );
    }
    if (!env(REQUIRED_ENV[explicit])) {
      throw new Error(
        `SEARCH_PROVIDER=${explicit} requires ${REQUIRED_ENV[explicit]} to be set.`
      );
    }
    return explicit;
  }
  if (env("SEARXNG_BASE_URL")) return "searxng";
  if (env("BRAVE_KEY")) return "brave";
  if (env("BING_KEY")) return "bing";
  throw new Error(
    "No web search provider configured. Set SEARCH_PROVIDER and the matching " +
      "credentials (BRAVE_KEY, SEARXNG_BASE_URL, or BING_KEY)."
  );
};

const MAX_RESULTS = 8;
const REQUEST_TIMEOUT_MS = 15000;

const searchBrave = async (query: string): Promise<SearchResult[]> => {
  const client = axios.create({
    baseURL: "https://api.search.brave.com/res/v1",
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": env("BRAVE_KEY") as string,
    },
  });

  const res = await client.get("/web/search", {
    params: { q: query, count: MAX_RESULTS },
  });

  const results = (res.data?.web?.results ?? []) as {
    title: string;
    description: string;
  }[];

  return results.map((r) => ({ title: r.title, snippet: r.description }));
};

const searchSearxng = async (query: string): Promise<SearchResult[]> => {
  const baseURL = (env("SEARXNG_BASE_URL") as string).replace(/\/+$/, "");
  const client = axios.create({ baseURL, timeout: REQUEST_TIMEOUT_MS });

  const res = await client.get("/search", {
    params: { q: query, format: "json" },
  });

  const results = (res.data?.results ?? []) as {
    title: string;
    content: string;
  }[];

  return results
    .slice(0, MAX_RESULTS)
    .map((r) => ({ title: r.title, snippet: r.content }));
};

const searchBing = async (query: string): Promise<SearchResult[]> => {
  const client = axios.create({
    baseURL: "https://api.bing.microsoft.com/v7.0",
    timeout: REQUEST_TIMEOUT_MS,
    headers: { "Ocp-Apim-Subscription-Key": env("BING_KEY") as string },
  });

  const res = await client.get("/search", {
    params: { q: query, mkt: "en-us" },
  });

  const results = (res.data?.webPages?.value ?? []) as {
    name: string;
    snippet: string;
  }[];

  return results.map((r) => ({ title: r.name, snippet: r.snippet }));
};

export const getSearchResults = async (
  query: string
): Promise<SearchResult[]> => {
  const provider = resolveProvider();

  switch (provider) {
    case "brave":
      return searchBrave(query);
    case "searxng":
      return searchSearxng(query);
    case "bing":
      return searchBing(query);
  }
};
