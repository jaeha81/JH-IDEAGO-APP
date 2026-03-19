"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner if not previously dismissed
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-surface border border-border p-4 shadow-xl animate-in slide-in-from-bottom">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">IDEAGO 앱 설치</p>
        <p className="text-xs text-text-muted mt-0.5">홈 화면에 추가하여 앱처럼 사용하세요</p>
      </div>
      <Button size="sm" onClick={handleInstall}>설치</Button>
      <button onClick={handleDismiss} className="text-text-muted p-1" aria-label="닫기">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}
