import { Icon } from "./icon";

export function SessionTypeIcon({
  type,
  size = 14,
}: {
  type: "online" | "offline";
  size?: number;
}) {
  const isOnline = type === "online";

  return (
    <span
      title={isOnline ? "Online" : "Live"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 8,
        height: size + 8,
        borderRadius: 6,
        flexShrink: 0,
        background: isOnline ? "var(--felt-soft)" : "var(--accent-soft)",
        color: isOnline ? "var(--felt)" : "var(--accent)",
      }}
    >
      <Icon name={isOnline ? "monitor" : "users"} size={size - 2} strokeWidth={2} />
    </span>
  );
}
