"use client";

// Confirm modal before deleting a leaf folder.
// Warns when attached tasks will be removed with the folder.

import { useEffect, useRef, useState } from "react";

type ConfirmDeleteFolderProps = {
  folderName: string;
  taskCount: number;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDeleteFolder({
  folderName,
  taskCount,
  onCancel,
  onConfirm,
}: ConfirmDeleteFolderProps) {
  const [pending, setPending] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  const taskWarning =
    taskCount === 1
      ? "Any tasks attached to this item will also be deleted (1 task)."
      : taskCount > 1
        ? `Any tasks attached to this item will also be deleted (${taskCount} tasks).`
        : null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Delete folder"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-[var(--border)] bg-white p-5 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Delete “{folderName}”?
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          This cannot be undone.
        </p>
        {taskWarning && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {taskWarning}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-sm text-[var(--muted)] hover:bg-black/[0.04]"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="submit"
            disabled={pending}
            className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
