import type { PluginManifest, PluginDefinition } from "./plugin-api";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
const APP_VERSION = "1.0.0";

// ─── Error types ─────────────────────────────────────────────────────────────

export type PluginLoadErrorCode =
  | "NETWORK"
  | "INVALID_MANIFEST"
  | "VERSION_MISMATCH"
  | "EXECUTION_ERROR";

export class PluginLoadError extends Error {
  readonly code: PluginLoadErrorCode;

  constructor(code: PluginLoadErrorCode, message: string) {
    super(message);
    this.name = "PluginLoadError";
    this.code = code;
  }
}

// ─── Semver comparison ───────────────────────────────────────────────────────

function parseSemver(v: string): [number, number, number] {
  const parts = v.replace(/^v/, "").split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function semverGte(current: string, required: string): boolean {
  const [aMaj, aMin, aPat] = parseSemver(current);
  const [bMaj, bMin, bPat] = parseSemver(required);
  if (aMaj !== bMaj) return aMaj > bMaj;
  if (aMin !== bMin) return aMin > bMin;
  return aPat >= bPat;
}

// ─── Manifest validation ─────────────────────────────────────────────────────

const REQUIRED_MANIFEST_FIELDS: (keyof PluginManifest)[] = [
  "id",
  "name",
  "version",
  "entry",
];

function validateManifest(raw: unknown): PluginManifest {
  if (!raw || typeof raw !== "object") {
    throw new PluginLoadError("INVALID_MANIFEST", "Manifest is not a valid object");
  }

  const obj = raw as Record<string, unknown>;

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (typeof obj[field] !== "string" || (obj[field] as string).trim() === "") {
      throw new PluginLoadError(
        "INVALID_MANIFEST",
        `Missing or empty required field: "${field}"`,
      );
    }
  }

  if (!Array.isArray(obj["permissions"])) {
    throw new PluginLoadError("INVALID_MANIFEST", 'Field "permissions" must be an array');
  }

  if (!Array.isArray(obj["tags"])) {
    throw new PluginLoadError("INVALID_MANIFEST", 'Field "tags" must be an array');
  }

  const manifest = raw as PluginManifest;

  if (
    typeof manifest.minAppVersion === "string" &&
    manifest.minAppVersion.trim() !== "" &&
    !semverGte(APP_VERSION, manifest.minAppVersion)
  ) {
    throw new PluginLoadError(
      "VERSION_MISMATCH",
      `Plugin requires app v${manifest.minAppVersion}, current is v${APP_VERSION}`,
    );
  }

  return manifest;
}

// ─── Sandboxed execution ─────────────────────────────────────────────────────

const SANDBOX_ALLOWED_GLOBALS = Object.freeze([
  "console",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "Promise",
  "JSON",
  "Math",
  "Date",
  "Array",
  "Object",
  "String",
  "Number",
  "Boolean",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "Symbol",
  "Error",
  "TypeError",
  "RangeError",
  "URL",
  "URLSearchParams",
  "TextEncoder",
  "TextDecoder",
  "crypto",
  "atob",
  "btoa",
]);

function executeSandboxed(code: string, manifest: PluginManifest): PluginDefinition {
  try {
    const exports: Record<string, unknown> = {};
    const module = { exports };

    const allowedGlobals: Record<string, unknown> = {};
    for (const name of SANDBOX_ALLOWED_GLOBALS) {
      if (typeof globalThis !== "undefined" && name in globalThis) {
        allowedGlobals[name] = (globalThis as Record<string, unknown>)[name];
      }
    }

    const wrappedCode = `"use strict";\n${code}\n;return module.exports;`;

    const sandboxFn = new Function("module", "exports", ...Object.keys(allowedGlobals), wrappedCode);

    const result = sandboxFn(module, exports, ...Object.values(allowedGlobals)) as Record<string, unknown>;

    const pluginExport = (result && typeof result === "object" ? result : module.exports) as Record<string, unknown>;
    const definition = (pluginExport["default"] ?? pluginExport) as Record<string, unknown>;

    if (typeof definition["activate"] !== "function") {
      throw new PluginLoadError(
        "EXECUTION_ERROR",
        `Plugin "${manifest.id}" does not export an activate() function`,
      );
    }

    if (typeof definition["deactivate"] !== "function") {
      throw new PluginLoadError(
        "EXECUTION_ERROR",
        `Plugin "${manifest.id}" does not export a deactivate() function`,
      );
    }

    return {
      manifest,
      activate: definition["activate"] as PluginDefinition["activate"],
      deactivate: definition["deactivate"] as PluginDefinition["deactivate"],
    };
  } catch (err) {
    if (err instanceof PluginLoadError) throw err;
    throw new PluginLoadError(
      "EXECUTION_ERROR",
      `Failed to execute plugin "${manifest.id}": ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

async function fetchText(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch (err) {
    throw new PluginLoadError(
      "NETWORK",
      `Network error fetching ${url}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!response.ok) {
    throw new PluginLoadError("NETWORK", `HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

export async function loadPlugin(
  githubRepo: string,
  pluginPath: string,
): Promise<PluginDefinition> {
  const branch = "main";
  const baseUrl = `${GITHUB_RAW_BASE}/${githubRepo}/${branch}/${pluginPath}`;

  const manifestJson = await fetchText(`${baseUrl}/plugin.json`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestJson);
  } catch {
    throw new PluginLoadError("INVALID_MANIFEST", "plugin.json is not valid JSON");
  }

  const manifest = validateManifest(parsed);
  const entryCode = await fetchText(`${baseUrl}/${manifest.entry}`);

  return executeSandboxed(entryCode, manifest);
}
