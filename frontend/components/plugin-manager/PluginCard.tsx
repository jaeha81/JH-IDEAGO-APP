"use client";

import type { InstalledPlugin, PluginManifest } from "@/lib/plugin-api";
import { Button } from "@/components/ui/Button";

// ─── Registry Card (not installed) ───────────────────────────────────────────

interface RegistryCardProps {
  manifest: PluginManifest;
  onInstall: (manifest: PluginManifest) => void;
  installing: boolean;
}

export function RegistryCard({ manifest, onInstall, installing }: RegistryCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface px-5 py-4 flex items-start gap-4">
      <PluginIcon id={manifest.id} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white truncate">{manifest.name}</span>
          <span className="text-[10px] text-text-muted font-mono">v{manifest.version}</span>
          {manifest.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} label={tag} />
          ))}
        </div>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{manifest.description}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
          <span>{manifest.size}</span>
          <span aria-hidden>·</span>
          <span>{manifest.permissions.length} permission{manifest.permissions.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onInstall(manifest)}
        loading={installing}
        disabled={installing}
        className="shrink-0 min-w-[72px]"
      >
        Install
      </Button>
    </article>
  );
}

// ─── Installed Card ───────────────────────────────────────────────────────────

interface InstalledCardProps {
  plugin: InstalledPlugin;
  onToggle: (id: string) => void;
  onUninstall: (id: string) => void;
  busy: boolean;
}

export function InstalledCard({ plugin, onToggle, onUninstall, busy }: InstalledCardProps) {
  const { manifest, enabled, installedAt } = plugin;

  return (
    <article className="rounded-2xl border border-border bg-surface px-5 py-4 flex items-start gap-4">
      <PluginIcon id={manifest.id} dimmed={!enabled} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium truncate ${enabled ? "text-white" : "text-text-secondary"}`}>
            {manifest.name}
          </span>
          <span className="text-[10px] text-text-muted font-mono">v{manifest.version}</span>
          <StatusDot enabled={enabled} />
        </div>
        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{manifest.description}</p>
        <p className="text-[10px] text-text-muted mt-1.5">
          Installed {formatDate(installedAt)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Toggle checked={enabled} onChange={() => onToggle(manifest.id)} disabled={busy} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUninstall(manifest.id)}
          disabled={busy}
          className="text-danger hover:text-danger px-2"
          aria-label={`Uninstall ${manifest.name}`}
        >
          <TrashIcon />
        </Button>
      </div>
    </article>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function PluginCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4 flex items-start gap-4 animate-pulse">
      <div className="h-9 w-9 rounded-xl bg-surface-overlay shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2">
          <div className="h-3.5 w-28 rounded-md bg-surface-overlay" />
          <div className="h-3.5 w-10 rounded-md bg-surface-overlay" />
        </div>
        <div className="h-3 w-3/4 rounded-md bg-surface-overlay" />
        <div className="h-2.5 w-1/3 rounded-md bg-surface-overlay" />
      </div>
      <div className="h-8 w-16 rounded-lg bg-surface-overlay shrink-0" />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PluginIcon({ id, dimmed = false }: { id: string; dimmed?: boolean }) {
  const hue = stringToHue(id);
  return (
    <div
      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold transition-opacity ${dimmed ? "opacity-40" : ""}`}
      style={{ background: `hsl(${hue}, 30%, 22%)`, color: `hsl(${hue}, 60%, 75%)` }}
      aria-hidden="true"
    >
      {id.charAt(id.lastIndexOf("-") + 1).toUpperCase()}
    </div>
  );
}

function TagBadge({ label }: { label: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded-md bg-surface-raised border border-border text-[9px] text-text-muted uppercase tracking-wide">
      {label}
    </span>
  );
}

function StatusDot({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`h-1.5 w-1.5 rounded-full ${enabled ? "bg-success" : "bg-text-muted"}`}
      aria-label={enabled ? "Active" : "Disabled"}
    />
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={[
        "relative h-5 w-9 rounded-full transition-colors duration-150 focus:outline-none",
        "focus:ring-2 focus:ring-white/20 disabled:opacity-40 disabled:cursor-not-allowed",
        checked ? "bg-white/90" : "bg-surface-overlay border border-border-strong",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform duration-150",
          checked ? "translate-x-4 bg-[#0F0F0F]" : "translate-x-0 bg-text-muted",
        ].join(" ")}
      />
    </button>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1M4 3.5l.667 7a.5.5 0 0 0 .5.5h3.666a.5.5 0 0 0 .5-.5L10 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stringToHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}
