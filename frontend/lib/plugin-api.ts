// ─── IDEAGO Plugin API — Type Definitions ───────────────────────────────────
// Public SDK consumed by third-party plugin authors. JSDoc is intentional.
// ─────────────────────────────────────────────────────────────────────────────

export const PLUGIN_API_VERSION = "1.0" as const;

// ─── Permissions ─────────────────────────────────────────────────────────────

export type PluginPermission =
  | "canvas.read"
  | "canvas.write"
  | "agent.call"
  | "storage.read"
  | "storage.write"
  | "ui.sidebar"
  | "ui.toolbar"
  | "ui.modal"
  | "export.hook"
  | "network";

// ─── Plugin Manifest (plugin.json) ──────────────────────────────────────────

export interface PluginManifest {
  /** Unique plugin identifier, e.g. `"ideago-ai-provider"` */
  id: string;
  name: string;
  /** Semver, e.g. `"1.0.0"` */
  version: string;
  description: string;
  author: string;
  /** Semver — minimum IDEAGO app version required to load */
  minAppVersion: string;
  /** Relative path to bundled entry, e.g. `"dist/index.js"` */
  entry: string;
  permissions: PluginPermission[];
  /** `"owner/repo"` format */
  githubRepo: string;
  /** Path inside the repo, e.g. `"plugins/ai-provider"` */
  pluginPath: string;
  tags: string[];
  /** Human-readable, e.g. `"12KB"` */
  size: string;
}

// ─── Canvas ──────────────────────────────────────────────────────────────────

export interface CanvasNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: Record<string, unknown>;
}

export type CanvasEventType = "select" | "change";
export type CanvasEventCallback = (nodes: CanvasNode[]) => void;

export interface CanvasAPI {
  getNodes(): CanvasNode[];
  getSelection(): CanvasNode[];
  on(event: CanvasEventType, cb: CanvasEventCallback): void;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface PluginStorage {
  /** Returns `null` when key does not exist. */
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventEmitter = (event: string, payload?: unknown) => void;
export type EventListener = (event: string, cb: (payload?: unknown) => void) => void;

// ─── Plugin Context ──────────────────────────────────────────────────────────

export interface PluginContext {
  manifest: PluginManifest;
  /** Scoped per-plugin — keys are namespaced automatically. */
  storage: PluginStorage;
  canvas: CanvasAPI;
  emit: EventEmitter;
  on: EventListener;
}

// ─── UI Extensions ──────────────────────────────────────────────────────────

export type UIExtensionType =
  | "sidebar-panel"
  | "toolbar-button"
  | "context-menu-item";

export interface UIExtension {
  type: UIExtensionType;
  label: string;
  icon?: string;
  /** Returns a React node at runtime. Typed `unknown` to keep this file framework-agnostic. */
  render: () => unknown;
}

// ─── Plugin Definition ──────────────────────────────────────────────────────

export interface PluginDefinition {
  manifest: PluginManifest;
  /** Return UI extensions to register. Avoid network calls — keep under 200ms. */
  activate(ctx: PluginContext): Promise<UIExtension[]>;
  /** Tear down listeners, timers, DOM mutations. */
  deactivate(): Promise<void>;
}

// ─── Installed Plugin (persisted state) ──────────────────────────────────────

export interface InstalledPlugin {
  manifest: PluginManifest;
  enabled: boolean;
  /** ISO 8601 timestamp */
  installedAt: string;
}
