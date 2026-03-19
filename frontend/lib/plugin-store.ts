"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PluginManifest, InstalledPlugin } from "./plugin-api";

const STORAGE_KEY = "ideago:installed-plugins";

function readStorage(): InstalledPlugin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as InstalledPlugin[];
  } catch {
    return [];
  }
}

function writeStorage(plugins: InstalledPlugin[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plugins));
  } catch {
    // storage full or blocked — silently degrade
  }
}

export interface PluginStoreState {
  installedPlugins: InstalledPlugin[];
  activePlugins: InstalledPlugin[];
  isLoading: boolean;
  installPlugin: (manifest: PluginManifest) => Promise<void>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  togglePlugin: (pluginId: string) => Promise<void>;
}

export function usePluginStore(): PluginStoreState {
  const [plugins, setPlugins] = useState<InstalledPlugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setPlugins(readStorage());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: InstalledPlugin[]) => {
    setPlugins(next);
    writeStorage(next);
  }, []);

  const installPlugin = useCallback(
    async (manifest: PluginManifest): Promise<void> => {
      setIsLoading(true);
      try {
        setPlugins((prev) => {
          const alreadyInstalled = prev.some((p) => p.manifest.id === manifest.id);
          if (alreadyInstalled) return prev;

          const next: InstalledPlugin[] = [
            ...prev,
            { manifest, enabled: true, installedAt: new Date().toISOString() },
          ];
          writeStorage(next);
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const uninstallPlugin = useCallback(
    async (pluginId: string): Promise<void> => {
      setIsLoading(true);
      try {
        setPlugins((prev) => {
          const next = prev.filter((p) => p.manifest.id !== pluginId);
          writeStorage(next);
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const togglePlugin = useCallback(
    async (pluginId: string): Promise<void> => {
      setIsLoading(true);
      try {
        setPlugins((prev) => {
          const next = prev.map((p) =>
            p.manifest.id === pluginId ? { ...p, enabled: !p.enabled } : p,
          );
          writeStorage(next);
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const activePlugins = plugins.filter((p) => p.enabled);

  return {
    installedPlugins: plugins,
    activePlugins,
    isLoading,
    installPlugin,
    uninstallPlugin,
    togglePlugin,
  };
}
