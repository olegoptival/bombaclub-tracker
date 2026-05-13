import { Icon } from "./icon";

export function SessionTypeIcon({
  type,
  size = 14,
}: {
  type: "online" | "offline" | string | null | undefined;
  size?: number;
}) {
  const isOnline = type === "online";
  const accent = isOnline ? "var(--accent, #d4a747)" : "var(--accent-2, #c79a3a)";
  return (
    <span
      style={{
        width: size + 14,
        height: size + 14,
        borderRadius: 8,
        background: "var(--bg-2)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: accent,
        flexShrink: 0,
      }}
    >
      <Icon name={isOnline ? "monitor" : "users"} size={size} />
    </span>
  );
}
