"use client";

import { useState, useEffect, useCallback } from "react";
import { usePluginStore } from "@/lib/plugin-store";
import { fetchRegistry } from "@/lib/plugin-registry";
import type { PluginManifest } from "@/lib/plugin-api";
import { RegistryCard, InstalledCard, PluginCardSkeleton } from "./PluginCard";
import { Button } from "@/components/ui/Button";

type Tab = "browse" | "installed";

export function PluginManager() {
  const [tab, setTab] = useState<Tab>("browse");
  const [registry, setRegistry] = useState<PluginManifest[]>([]);
  const [registryLoading, setRegistryLoading] = useState(true);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customUrlError, setCustomUrlError] = useState<string | null>(null);

  const { installedPlugins, installPlugin, uninstallPlugin, togglePlugin, isLoading } =
    usePluginStore();

  useEffect(() => {
    let cancelled = false;
    setRegistryLoading(true);
    fetchRegistry()
      .then((plugins) => {
        if (!cancelled) {
          setRegistry(plugins);
          setRegistryError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setRegistryError("Could not load plugin registry. Check your connection.");
      })
      .finally(() => {
        if (!cancelled) setRegistryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInstall = useCallback(
    async (manifest: PluginManifest) => {
      setInstallingId(manifest.id);
      try {
        await installPlugin(manifest);
        setTab("installed");
      } finally {
        setInstallingId(null);
      }
    },
    [installPlugin],
  );

  const handleToggle = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await togglePlugin(id);
      } finally {
        setBusyId(null);
      }
    },
    [togglePlugin],
  );

  const handleUninstall = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await uninstallPlugin(id);
      } finally {
        setBusyId(null);
      }
    },
    [uninstallPlugin],
  );

  const handleCustomInstall = useCallback(async () => {
    setCustomUrlError(null);

    const trimmed = customUrl.trim();
    if (!trimmed) {
      setCustomUrlError("Enter a GitHub repository URL.");
      return;
    }

    const match = trimmed.match(/github\.com\/([^/]+\/[^/]+)(?:\/tree\/[^/]+)?\/?(plugins\/[^/?#]+)?/);
    if (!match) {
      setCustomUrlError("Invalid GitHub URL. Expected: github.com/owner/repo/...plugins/plugin-name");
      return;
    }

    const githubRepo = match[1];
    const pluginPath = match[2] ?? "plugins/custom";

    const syntheticManifest: PluginManifest = {
      id: `custom-${Date.now()}`,
      name: pluginPath.split("/").pop() ?? "Custom Plugin",
      version: "0.0.0",
      description: `Installed from ${githubRepo}`,
      author: "Unknown",
      minAppVersion: "1.0.0",
      entry: "dist/index.js",
      permissions: [],
      githubRepo,
      pluginPath,
      tags: ["custom"],
      size: "?",
    };

    setInstallingId(syntheticManifest.id);
    try {
      await installPlugin(syntheticManifest);
      setCustomUrl("");
      setTab("installed");
    } finally {
      setInstallingId(null);
    }
  }, [customUrl, installPlugin]);

  const installedIds = new Set(installedPlugins.map((p) => p.manifest.id));
  const browsePlugins = registry.filter((m) => !installedIds.has(m.id));

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-white">Plugins</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Extend IDEAGO with installable feature packs. Loaded on-demand from GitHub.
        </p>
      </header>

      <TabBar tab={tab} onChange={setTab} installedCount={installedPlugins.length} />

      {tab === "browse" && (
        <div className="space-y-3">
          {registryLoading ? (
            <>
              <PluginCardSkeleton />
              <PluginCardSkeleton />
              <PluginCardSkeleton />
            </>
          ) : registryError ? (
            <ErrorState message={registryError} onRetry={() => setRegistryLoading(true)} />
          ) : browsePlugins.length === 0 ? (
            <EmptyState message="All available plugins are installed." />
          ) : (
            browsePlugins.map((manifest) => (
              <RegistryCard
                key={manifest.id}
                manifest={manifest}
                onInstall={handleInstall}
                installing={installingId === manifest.id}
              />
            ))
          )}

          <CustomUrlInstaller
            value={customUrl}
            onChange={setCustomUrl}
            onInstall={handleCustomInstall}
            error={customUrlError}
            loading={!!installingId && installingId.startsWith("custom-")}
          />
        </div>
      )}

      {tab === "installed" && (
        <div className="space-y-3">
          {isLoading ? (
            <>
              <PluginCardSkeleton />
              <PluginCardSkeleton />
            </>
          ) : installedPlugins.length === 0 ? (
            <EmptyState message="No plugins installed yet. Browse the registry to add features." />
          ) : (
            installedPlugins.map((plugin) => (
              <InstalledCard
                key={plugin.manifest.id}
                plugin={plugin}
                onToggle={handleToggle}
                onUninstall={handleUninstall}
                busy={busyId === plugin.manifest.id}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

function TabBar({
  tab,
  onChange,
  installedCount,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  installedCount: number;
}) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border w-fit">
      {(["browse", "installed"] as Tab[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={[
            "px-4 h-8 rounded-lg text-xs font-medium transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-white/20",
            tab === t
              ? "bg-white text-[#0F0F0F]"
              : "text-text-secondary hover:text-white hover:bg-white/5",
          ].join(" ")}
        >
          {t === "browse" ? "Browse" : `Installed${installedCount > 0 ? ` (${installedCount})` : ""}`}
        </button>
      ))}
    </div>
  );
}

function CustomUrlInstaller({
  value,
  onChange,
  onInstall,
  error,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  onInstall: () => void;
  error: string | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4 space-y-3 mt-4">
      <p className="text-xs font-medium text-text-secondary">Install from GitHub URL</p>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onInstall()}
          placeholder="https://github.com/owner/repo/tree/main/plugins/my-plugin"
          className={[
            "flex-1 h-9 px-3 rounded-xl text-xs bg-surface-raised border transition-colors",
            "text-white placeholder:text-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-white/20",
            error ? "border-danger" : "border-border focus:border-border-strong",
          ].join(" ")}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={onInstall}
          loading={loading}
          disabled={loading}
          className="shrink-0"
        >
          Install
        </Button>
      </div>
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-10 text-center">
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-6 text-center space-y-3">
      <p className="text-sm text-danger">{message}</p>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
