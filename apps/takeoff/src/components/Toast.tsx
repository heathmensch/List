"use client";

// Lightweight toast host for API error/success messages on the Goals page.
// Pluto returns { error: string }; we surface that text here (e.g. delete tasks first).

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: number;
  message: string;
  tone: "error" | "success";
};

type ToastContextValue = {
  showToast: (message: string, tone?: "error" | "success") => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, tone: "error" | "success" = "error") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, tone }]);
      // Auto-dismiss so the UI stays clean without a close click.
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    [],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-6 bottom-6 z-50 flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-md ${
              toast.tone === "error"
                ? "border-red-200 bg-white text-red-800"
                : "border-emerald-200 bg-white text-emerald-900"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
