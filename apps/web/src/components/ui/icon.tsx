import type { CSSProperties } from "react";

export type IconName =
  | "home" | "list" | "scale" | "users" | "user" | "plus" | "minus"
  | "bell" | "check" | "x" | "chevR" | "chevL" | "chevD" | "arrowR"
  | "upload" | "image" | "monitor" | "felt" | "spade" | "search" | "filter"
  | "more" | "alert" | "dot" | "trend" | "refresh" | "zap" | "trash"
  | "edit" | "copy" | "clock";

const PATHS: Record<IconName, string> = {
  home:    "M3 12l9-9 9 9M5 10v10h14V10",
  list:    "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  scale:   "M12 3v18M5 9l-3 7c0 1.5 1.5 3 3 3s3-1.5 3-3l-3-7zm14 0l-3 7c0 1.5 1.5 3 3 3s3-1.5 3-3l-3-7zM6 6h12M9 4l3-1 3 1",
  users:   "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  user:    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  plus:    "M12 5v14M5 12h14",
  minus:   "M5 12h14",
  bell:    "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6L6 18M6 6l12 12",
  chevR:   "M9 18l6-6-6-6",
  chevL:   "M15 18l-6-6 6-6",
  chevD:   "M6 9l6 6 6-6",
  arrowR:  "M5 12h14M13 6l6 6-6 6",
  upload:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  image:   "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  monitor: "M2 4h20v12H2zM8 20h8M12 16v4",
  felt:    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  spade:   "M12 2C8 6 4 9 4 13a4 4 0 0 0 7 2.5L9 21h6l-2-5.5A4 4 0 0 0 20 13c0-4-4-7-8-11z",
  search:  "M11 11a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.35-4.35",
  filter:  "M3 4h18l-7 9v6l-4 2v-8L3 4z",
  more:    "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  alert:   "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  dot:     "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  trend:   "M23 6l-9.5 9.5-5-5L1 18",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  zap:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  trash:   "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  copy:    "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  clock:   "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
};

export function Icon({
  name,
  size = 18,
  color = "currentColor",
  strokeWidth = 1.75,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
