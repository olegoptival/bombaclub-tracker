"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type ExistingImport = {
  id: string;
  status: string;
  image_url: string;
  error_message: string | null;
  created_at: string;
};

type UploadItem = {
  // local id for the optimistic state, before server round-trip
  localId: string;
  filename: string;
  // 'uploading' | 'pending' (waiting for OCR) | 'failed'
  state: "uploading" | "pending" | "failed";
  error?: string;
  // server-side import id, once known
  importId?: string;
};

export function UploadWizard({
  sessionId,
  existingImports,
}: {
  sessionId: string;
  existingImports: ExistingImport[];
}) {
  const [items, setItems] = useState<UploadItem[]>(
    existingImports.map((i) => ({
      localId: i.id,
      filename: i.image_url.split("/").pop() ?? "screenshot",
      state: i.status === "failed" ? "failed" : "pending",
      error: i.error_message ?? undefined,
      importId: i.id,
    }))
  );
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadOne = useCallback(
    async (file: File) => {
      const localId = crypto.randomUUID();
      setItems((prev) => [
        ...prev,
        { localId, filename: file.name, state: "uploading" },
      ]);

      const fd = new FormData();
      fd.append("file", file);

      try {
        const res = await fetch(`/api/sessions/${sessionId}/screenshots`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) {
          setItems((prev) =>
            prev.map((it) =>
              it.localId === localId
                ? { ...it, state: "failed", error: data.error ?? "Upload failed" }
                : it
            )
          );
          return;
        }
        setItems((prev) =>
          prev.map((it) =>
            it.localId === localId
              ? {
                  ...it,
                  state: "pending",
                  importId: data.import.id,
                }
              : it
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setItems((prev) =>
          prev.map((it) =>
            it.localId === localId ? { ...it, state: "failed", error: msg } : it
          )
        );
      }
    },
    [sessionId]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      arr.forEach(uploadOne);
    },
    [uploadOne]
  );

  // Paste from clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files: File[] = [];
      const dt = e.clipboardData;
      if (!dt) return;
      for (const item of dt.items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const allReady =
    items.length > 0 &&
    items.every((it) => it.state === "pending");

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          padding: "32px 20px",
          borderRadius: "var(--r-lg)",
          background: dragOver ? "var(--accent-soft)" : "var(--bg-1)",
          boxShadow: dragOver
            ? "0 0 0 2px var(--accent-ring) inset"
            : "0 0 0 1px var(--line-strong) inset",
          textAlign: "center",
          cursor: "pointer",
          transition: "background 120ms, box-shadow 120ms",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: dragOver ? "var(--accent-hi)" : "var(--fg-2)",
            marginBottom: 8,
          }}
        >
          ↑
        </div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          Drop screenshots here
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 4 }}>
          or tap to choose · paste also works
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <p
        className="pkr-help"
        style={{ marginTop: 10, paddingInline: 4, lineHeight: 1.5 }}
      >
        All screenshots must be from the SAME table session. Different tables =
        different sessions in the app.
      </p>

      {/* Items list */}
      {items.length > 0 && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it) => (
            <ItemRow key={it.localId} item={it} />
          ))}
        </div>
      )}

      {/* Continue button */}
      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          disabled={!allReady}
          onClick={() => alert("OCR + matching come in the next steps")}
          className="pkr-btn pkr-btn--primary pkr-btn--block"
        >
          Continue
        </button>
        {!allReady && items.length > 0 && (
          <p
            className="pkr-help"
            style={{ marginTop: 8, textAlign: "center" }}
          >
            Wait for all uploads to finish.
          </p>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: UploadItem }) {
  const stateLabel =
    item.state === "uploading"
      ? "Uploading…"
      : item.state === "pending"
      ? "Awaiting OCR"
      : "Failed";

  const stateColor =
    item.state === "uploading"
      ? "var(--fg-2)"
      : item.state === "pending"
      ? "var(--felt)"
      : "var(--neg)";

  return (
    <div
      className="pkr-card"
      style={{
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-sm)",
          background: "var(--bg-2)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg-3)",
          fontSize: 18,
        }}
      >
        ▦
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.filename}
        </div>
        <div style={{ fontSize: 11.5, color: stateColor, marginTop: 2 }}>
          {stateLabel}
          {item.error && (
            <span style={{ color: "var(--neg)" }}> · {item.error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
