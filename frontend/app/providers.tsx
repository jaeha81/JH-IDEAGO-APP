"use client";

import { AuthProvider } from "@/lib/context/AuthContext";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <PwaInstallPrompt />
    </AuthProvider>
  );
}
