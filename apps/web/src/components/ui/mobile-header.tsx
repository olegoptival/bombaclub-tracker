import { Icon } from "./icon";
import { PlayerAvatar } from "./player-avatar";

export function MobileHeader({
  clubName,
  role,
  memberCount,
  notificationCount = 0,
  userName,
}: {
  clubName: string;
  role: string;
  memberCount?: number;
  notificationCount?: number;
  userName: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px 6px",
      }}
    >
      {/* Club switcher button — interactivity wired in Phase 3 */}
      <button
        type="button"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "transparent",
          border: "none",
          padding: "4px 4px",
          color: "var(--fg-0)",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "linear-gradient(135deg, #2a1f0e, #4a3618)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
            boxShadow: "0 0 0 0.5px var(--accent-ring) inset",
            flexShrink: 0,
          }}
        >
          <Icon name="spade" size={14} strokeWidth={1.8} />
        </span>
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            lineHeight: 1.1,
          }}
        >
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{clubName}</span>
          <span
            style={{
              fontSize: 11,
              color: "var(--fg-2)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {role}
            {memberCount != null && ` · ${memberCount} members`}
          </span>
        </span>
        <Icon name="chevD" size={14} color="var(--fg-2)" />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Bell */}
        <button
          type="button"
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--fg-1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="bell" size={18} />
          {notificationCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                width: 7,
                height: 7,
                borderRadius: 999,
                background: "var(--accent)",
                boxShadow: "0 0 0 2px var(--bg-0)",
              }}
            />
          )}
        </button>

        <PlayerAvatar name={userName} size={32} you />
      </div>
    </div>
  );
}
