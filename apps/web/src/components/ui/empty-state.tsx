import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export function EmptyState({
  icon = "list",
  title,
  body,
  cta,
}: {
  icon?: IconName;
  title: string;
  body?: string;
  cta?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: "var(--bg-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--fg-2)",
          boxShadow: "0 0 0 0.5px var(--line-strong) inset",
        }}
      >
        <Icon name={icon} size={24} />
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "var(--fg-0)",
          marginTop: 4,
        }}
      >
        {title}
      </div>
      {body && (
        <div
          style={{
            fontSize: 14,
            color: "var(--fg-2)",
            maxWidth: 280,
            lineHeight: 1.4,
          }}
        >
          {body}
        </div>
      )}
      {cta && <div style={{ marginTop: 8 }}>{cta}</div>}
    </div>
  );
}
