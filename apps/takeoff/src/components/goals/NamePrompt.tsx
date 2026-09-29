"use client";

// Modal name prompt used for "+ Add Goal" and "Add another goal folder".

import { useEffect, useRef, useState } from "react";

type NamePromptProps = {
  title: string;
  confirmLabel: string;
  initialValue?: string;
  onCancel: () => void;
  onConfirm: (name: string) => void | Promise<void>;
};

export function NamePrompt({
  title,
  confirmLabel,
  initialValue = "",
  onCancel,
  onConfirm,
}: NamePromptProps) {
  const [name, setName] = useState(initialValue);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);
    try {
      await onConfirm(trimmed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          className="mt-4 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand)]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-black/[0.04]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending || !name.trim()}
            className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
