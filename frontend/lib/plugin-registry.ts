import type { PluginManifest } from "./plugin-api";

const REGISTRY_URL =
  "https://raw.githubusercontent.com/jaeha81/JH-IDEAGO/main/plugins/registry/index.json";

const CACHE_TTL_MS = 5 * 60 * 1000;

interface RegistryCache {
  data: PluginManifest[];
  fetchedAt: number;
}

let cache: RegistryCache | null = null;

function isCacheFresh(): boolean {
  return cache !== null && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export async function fetchRegistry(): Promise<PluginManifest[]> {
  if (isCacheFresh()) return cache!.data;

  try {
    const response = await fetch(REGISTRY_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json: unknown = await response.json();

    if (!Array.isArray(json)) {
      throw new Error("Registry response is not an array");
    }

    const manifests = json as PluginManifest[];
    cache = { data: manifests, fetchedAt: Date.now() };
    return manifests;
  } catch {
    if (cache) return cache.data;
    return [];
  }
}

export function clearRegistryCache(): void {
  cache = null;
}
