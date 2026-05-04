"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icon";

export function UndoBanner({
  endedAt,
  subtitle,
  onUndo,
  windowSeconds = 300,
}: {
  /** ISO timestamp when the session was finalized */
  endedAt: string;
  subtitle: string;
  onUndo?: () => void;
  /** Undo window duration in seconds (default 300 = 5 min) */
  windowSeconds?: number;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, windowSeconds - Math.floor((Date.now() - new Date(endedAt).getTime()) / 1000))
  );

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  if (remaining <= 0) return null;

  const m = Math.floor(remaining / 60);
  const s = (remaining % 60).toString().padStart(2, "0");

  return (
    <div
      style={{
        margin: "14px 14px 0",
        padding: "12px 14px",
        borderRadius: 12,
        background: "linear-gradient(180deg, rgba(212,164,55,0.16), rgba(212,164,55,0.06))",
        boxShadow: "0 0 0 0.5px var(--accent-ring) inset",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "var(--accent)",
          color: "#1a1408",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="clock" size={16} strokeWidth={2.2} />
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--accent-hi)" }}>
          Notifications going out in {m}:{s}
        </div>
        <div style={{ fontSize: 11.5, color: "var(--fg-2)" }}>{subtitle}</div>
      </div>

      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="pkr-btn pkr-btn--ghost pkr-btn--sm"
        >
          Undo
        </button>
      )}
    </div>
  );
}
