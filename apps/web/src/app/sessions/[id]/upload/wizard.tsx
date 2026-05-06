"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type ImportStatus = "pending" | "processing" | "parsed" | "failed" | "rejected" | "confirmed";

type ImportPreview = {
  table_name?: string;
  players_count?: number;
  balance_ok?: boolean;
};

type ImportItem = {
  id: string;
  status: ImportStatus;
  error_message: string | null;
  preview: ImportPreview | null;
};

type LocalUpload = {
  localId: string;
  filename: string;
  state: "uploading" | "failed";
  error?: string;
};

type ExistingImport = {
  id: string;
  status: string;
  image_url: string;
  error_message: string | null;
  created_at: string;
};

export function UploadWizard({
  sessionId,
  existingImports,
}: {
  sessionId: string;
  existingImports: ExistingImport[];
}) {
  const [serverItems, setServerItems] = useState<ImportItem[]>(
    existingImports.map((i) => ({
      id: i.id,
      status: i.status as ImportStatus,
      error_message: i.error_message,
      preview: null,
    }))
  );
  const [localUploads, setLocalUploads] = useState<LocalUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Polling status of all imports while any is pending/processing
  useEffect(() => {
    const anyActive = serverItems.some(
      (i) => i.status === "pending" || i.status === "processing"
    );
    if (!anyActive) return;

    const tick = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/screenshots/status`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setServerItems(data.items as ImportItem[]);
      } catch {
        // Network blip — try again next tick
      }
    };

    const id = window.setInterval(tick, 1500);
    return () => window.clearInterval(id);
  }, [sessionId, serverItems]);

  const uploadOne = useCallback(
    async (file: File) => {
      const localId = crypto.randomUUID();
      setLocalUploads((prev) => [
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
          setLocalUploads((prev) =>
            prev.map((it) =>
              it.localId === localId
                ? { ...it, state: "failed", error: data.error ?? "Upload failed" }
                : it
            )
          );
          return;
        }
        // Add to server items in pending state and remove local upload
        setServerItems((prev) => {
          if (prev.some((p) => p.id === data.import.id)) return prev;
          return [
            ...prev,
            {
              id: data.import.id,
              status: data.import.status as ImportStatus,
              error_message: null,
              preview: null,
            },
          ];
        });
        setLocalUploads((prev) => prev.filter((it) => it.localId !== localId));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setLocalUploads((prev) =>
          prev.map((it) =>
            it.localId === localId ? { ...it, state: "failed", error: msg } : it
          )
        );
      }
    },
    [sessionId]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => Array.from(files).forEach(uploadOne),
    [uploadOne]
  );

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

  const deleteServerItem = async (importId: string) => {
    if (!confirm("Delete this screenshot?")) return;
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/screenshots/${importId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete");
        return;
      }
      setServerItems((prev) => prev.filter((it) => it.id !== importId));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      alert(msg);
    }
  };

  const removeLocalItem = (localId: string) => {
    setLocalUploads((prev) => prev.filter((it) => it.localId !== localId));
  };

    const allReady =
    serverItems.length > 0 &&
    serverItems.every((i) => i.status === "parsed") &&
    localUploads.length === 0;

  return (
    <div>
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
        <div style={{ fontSize: 28, color: dragOver ? "var(--accent-hi)" : "var(--fg-2)", marginBottom: 8 }}>↑</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Drop screenshots here</div>
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

      <p className="pkr-help" style={{ marginTop: 10, paddingInline: 4, lineHeight: 1.5 }}>
        All screenshots must be from the SAME table session. Different tables = different sessions in the app.
      </p>

      {(serverItems.length > 0 || localUploads.length > 0) && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {serverItems.map((it) => (
            <ServerItemRow key={it.id} item={it} onDelete={() => deleteServerItem(it.id)} />
          ))}
          {localUploads.map((it) => (
            <LocalItemRow key={it.localId} item={it} onRemove={() => removeLocalItem(it.localId)} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          disabled={!allReady}
          onClick={() => window.location.href = `/sessions/${sessionId}/match`}
          className="pkr-btn pkr-btn--primary pkr-btn--block"
        >
          Continue
        </button>
        {!allReady && (serverItems.length > 0 || localUploads.length > 0) && (
          <p className="pkr-help" style={{ marginTop: 8, textAlign: "center" }}>
            Wait for all uploads and OCR to finish.
          </p>
        )}
      </div>
    </div>
  );
}

function ServerItemRow({ item, onDelete }: { item: ImportItem; onDelete: () => void }) {
  const label =
    item.status === "pending"
      ? "Queued"
      : item.status === "processing"
      ? "Recognizing…"
      : item.status === "parsed"
      ? "Parsed"
      : item.status === "failed"
      ? "Failed"
      : item.status;

  const color =
    item.status === "parsed"
      ? "var(--pos)"
      : item.status === "failed"
      ? "var(--neg)"
      : item.status === "processing"
      ? "var(--accent)"
      : "var(--fg-2)";

  return (
    <div className="pkr-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
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
        {item.preview && item.status === "parsed" ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {item.preview.table_name ?? "Table"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--fg-2)", marginTop: 2 }}>
              {item.preview.players_count ?? "?"} players
              {item.preview.balance_ok !== undefined && (
                <>
                  {" · "}
                  <span style={{ color: item.preview.balance_ok ? "var(--pos)" : "var(--status-warning)" }}>
                    {item.preview.balance_ok ? "Sums to 0 ✓" : "Sum off"}
                  </span>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--fg-2)" }} data-mono>
              {item.id.slice(0, 8)}
            </div>
            <div style={{ fontSize: 11.5, color, marginTop: 2 }}>
              {label}
              {item.error_message && (
                <span style={{ color: "var(--neg)" }}> · {item.error_message}</span>
              )}
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        title="Delete screenshot"
        aria-label="Delete screenshot"
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: "transparent",
          border: "none",
          color: "var(--fg-3)",
          cursor: "pointer",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        ×
      </button>
    </div>
  );
}

function LocalItemRow({ item, onRemove }: { item: LocalUpload; onRemove: () => void }) {
  const color = item.state === "failed" ? "var(--neg)" : "var(--fg-2)";
  return (
    <div className="pkr-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
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
        <div style={{ fontSize: 11.5, color, marginTop: 2 }}>
          {item.state === "uploading" ? "Uploading…" : "Failed"}
          {item.error && <span> · {item.error}</span>}
        </div>
      </div>
      {item.state === "failed" && (
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          aria-label="Remove"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "transparent",
            border: "none",
            color: "var(--fg-3)",
            cursor: "pointer",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
