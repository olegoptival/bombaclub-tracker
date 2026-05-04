const PALETTE: [string, string][] = [
  ["#3a2d1a", "#d4a437"], // amber
  ["#1f3326", "#6fbf73"], // green
  ["#33231f", "#d97565"], // rust
  ["#2d2540", "#a98be0"], // violet
  ["#1f3340", "#7ab7d4"], // steel
  ["#3a2a3a", "#d4a3c8"], // mauve
  ["#3a3520", "#c8c073"], // ochre
  ["#1f3a35", "#6fc0b3"], // teal
];

function pickColor(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h * 31) + seed.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(h) % PALETTE.length]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function PlayerAvatar({
  name = "?",
  size = 36,
  guest = false,
  you = false,
}: {
  name?: string;
  size?: number;
  guest?: boolean;
  you?: boolean;
}) {
  const [bg, fg] = pickColor(name);

  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
        position: "relative",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: fg,
        fontFamily: "var(--font-ui)",
        fontWeight: 600,
        fontSize: Math.round(size * 0.38),
        letterSpacing: "0.5px",
        ...(guest
          ? { outline: `1.5px dashed ${fg}80`, outlineOffset: 2 }
          : {}),
        ...(you
          ? { boxShadow: "0 0 0 1.5px var(--accent)" }
          : {}),
      }}
    >
      {getInitials(name)}
    </div>
  );
}
