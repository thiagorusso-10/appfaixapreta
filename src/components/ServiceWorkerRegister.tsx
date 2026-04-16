"use client";

import { useEffect } from "react";

/**
 * Registra o Service Worker para PWA.
 * Componente client-only, renderiza nada visual.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }, []);

  return null;
}
