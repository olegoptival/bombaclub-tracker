// components.jsx — Shared components for Poker Club Tracker
// MoneyDisplay, PlayerAvatar, SessionTypeIcon, StatusBadge, EmptyState, NavBar, Icon

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Icon — single-stroke lucide-style icons
// ─────────────────────────────────────────────────────────────
const ICON_PATHS = {
  home:        "M3 12l9-9 9 9M5 10v10h14V10",
  list:        "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  scale:       "M12 3v18M5 9l-3 7c0 1.5 1.5 3 3 3s3-1.5 3-3l-3-7zm14 0l-3 7c0 1.5 1.5 3 3 3s3-1.5 3-3l-3-7zM6 6h12M9 4l3-1 3 1",
  users:       "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  user:        "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  plus:        "M12 5v14M5 12h14",
  minus:       "M5 12h14",
  bell:        "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  check:       "M20 6L9 17l-5-5",
  x:           "M18 6L6 18M6 6l12 12",
  chevR:       "M9 18l6-6-6-6",
  chevL:       "M15 18l-6-6 6-6",
  chevD:       "M6 9l6 6 6-6",
  arrowR:      "M5 12h14M13 6l6 6-6 6",
  upload:      "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  image:       "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21",
  monitor:     "M2 4h20v12H2zM8 20h8M12 16v4",
  felt:        "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
  spade:       "M12 2C8 6 4 9 4 13a4 4 0 0 0 7 2.5L9 21h6l-2-5.5A4 4 0 0 0 20 13c0-4-4-7-8-11z",
  search:      "M11 11a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.35-4.35",
  filter:      "M3 4h18l-7 9v6l-4 2v-8L3 4z",
  more:        "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  alert:       "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  dot:         "M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0",
  trend:       "M23 6l-9.5 9.5-5-5L1 18",
  refresh:     "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  zap:         "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  trash:       "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  edit:        "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  copy:        "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  clock:       "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2",
};

function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.75, style = {} }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, ...style }}>
      <path d={d} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// MoneyDisplay
//   variants: hero | medium | small | inline
//   sign-aware coloring; tabular mono; thousand separators
// ─────────────────────────────────────────────────────────────
function fmtMoney(n, { showZeroSign = false } = {}) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n > 0) return `+${formatted}`;
  if (n < 0) return `\u2212${formatted}`;
  return showZeroSign ? `±${formatted}` : `${formatted}`;
}

function MoneyDisplay({ value, variant = "medium", forceColor = null, mute = false, showZeroSign = false, weight }) {
  const sizes = {
    hero:    { fs: 56,  lh: 1.0,  fw: 500, ls: -0.03 },
    big:     { fs: 36,  lh: 1.05, fw: 500, ls: -0.025 },
    medium:  { fs: 16,  lh: 1.2,  fw: 500, ls: -0.01 },
    small:   { fs: 13,  lh: 1.2,  fw: 500, ls: -0.005 },
    inline:  { fs: 'inherit', lh: 'inherit', fw: 500, ls: 0 },
  };
  const s = sizes[variant] || sizes.medium;
  let color = forceColor;
  if (!color) {
    if (mute) color = 'var(--fg-1)';
    else if (value > 0) color = 'var(--pos)';
    else if (value < 0) color = 'var(--neg)';
    else color = 'var(--fg-1)';
  }
  return (
    <span data-mono style={{
      fontFamily: 'var(--font-mono)',
      fontVariantNumeric: 'tabular-nums',
      fontWeight: weight || s.fw,
      fontSize: s.fs, lineHeight: s.lh,
      letterSpacing: s.ls,
      color, whiteSpace: 'nowrap',
    }}>
      {fmtMoney(value, { showZeroSign })}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// PlayerAvatar — initials, deterministic warm palette, optional guest dotted ring
// ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#3a2d1a', '#d4a437'], // amber
  ['#1f3326', '#6fbf73'], // green
  ['#33231f', '#d97565'], // rust
  ['#2d2540', '#a98be0'], // violet
  ['#1f3340', '#7ab7d4'], // steel
  ['#3a2a3a', '#d4a3c8'], // mauve
  ['#3a3520', '#c8c073'], // ochre
  ['#1f3a35', '#6fc0b3'], // teal
];
function avatarColor(seed = '') {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PlayerAvatar({ name = '?', size = 36, guest = false, you = false }) {
  const [bg, fg] = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: '50%', position: 'relative',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: fg,
      fontFamily: 'var(--font-ui)',
      fontWeight: 600,
      fontSize: size * 0.38,
      letterSpacing: 0.5,
      ...(guest ? {
        outline: `1.5px dashed ${fg}80`,
        outlineOffset: 2,
      } : {}),
      ...(you ? {
        boxShadow: '0 0 0 1.5px var(--accent)',
      } : {}),
    }}>
      {initials(name)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SessionTypeIcon
// ─────────────────────────────────────────────────────────────
function SessionTypeIcon({ type, size = 14 }) {
  if (type === 'online') {
    return (
      <span title="Online" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size + 8, height: size + 8, borderRadius: 6,
        background: 'var(--felt-soft)', color: 'var(--felt)',
      }}>
        <Icon name="monitor" size={size - 2} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span title="Live" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size + 8, height: size + 8, borderRadius: 6,
      background: 'var(--accent-soft)', color: 'var(--accent)',
    }}>
      <Icon name="users" size={size - 2} strokeWidth={2} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// StatusBadge
// ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  ended:      { label: 'Ended',     dot: 'var(--fg-2)',         bg: 'rgba(255,255,255,0.04)', fg: 'var(--fg-1)' },
  live:       { label: 'Live',      dot: 'var(--felt)',         bg: 'var(--felt-soft)',       fg: '#7ed09a' },
  in_progress:{ label: 'In progress', dot: 'var(--accent)',     bg: 'var(--accent-soft)',     fg: 'var(--accent-hi)' },
  disputed:   { label: 'Disputed',  dot: 'var(--status-disputed)', bg: 'rgba(217,117,101,0.10)', fg: '#e89888' },
  cancelled:  { label: 'Cancelled', dot: 'var(--status-cancelled)', bg: 'rgba(255,255,255,0.03)', fg: 'var(--fg-2)' },
  auto:       { label: 'Auto-closed', dot: 'var(--fg-2)',       bg: 'rgba(255,255,255,0.03)', fg: 'var(--fg-2)' },
  active:     { label: 'Active',    dot: 'var(--felt)',         bg: 'var(--felt-soft)',       fg: '#7ed09a' },
  pending:    { label: 'Pending',   dot: 'var(--accent)',       bg: 'var(--accent-soft)',     fg: 'var(--accent-hi)' },
  rejected:   { label: 'Rejected',  dot: 'var(--status-disputed)', bg: 'rgba(217,117,101,0.10)', fg: '#e89888' },
  inactive:   { label: 'Inactive',  dot: 'var(--fg-3)',         bg: 'rgba(255,255,255,0.03)', fg: 'var(--fg-2)' },
};

function StatusBadge({ status, size = 'md' }) {
  const s = STATUS_MAP[status] || STATUS_MAP.ended;
  const py = size === 'sm' ? 2 : 4;
  const fs = size === 'sm' ? 10.5 : 11.5;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: `${py}px 8px`,
      background: s.bg, color: s.fg,
      borderRadius: 999,
      fontSize: fs, fontWeight: 500,
      letterSpacing: 0.01,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────
function EmptyState({ icon = 'list', title, body, cta }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', padding: '48px 24px', gap: 12,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'var(--bg-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--fg-2)',
        boxShadow: '0 0 0 0.5px var(--line-strong) inset',
      }}>
        <Icon name={icon} size={24} />
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg-0)', marginTop: 4 }}>{title}</div>
      {body && <div style={{ fontSize: 14, color: 'var(--fg-2)', maxWidth: 280, lineHeight: 1.4 }}>{body}</div>}
      {cta && <div style={{ marginTop: 8 }}>{cta}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sparkline — tiny recharts-style line, drawn as SVG
// ─────────────────────────────────────────────────────────────
function Sparkline({ data, width = 120, height = 32, stroke = 'var(--accent)', fill = 'var(--accent-soft)', showFill = true }) {
  if (!data || !data.length) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const pad = 2;
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = pad + (1 - (d.value - min) / range) * (height - pad * 2);
    return [x, y];
  });
  const linePath = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;
  const lastValue = data[data.length - 1].value;
  const lastUp = data.length > 1 && lastValue >= data[data.length - 2].value;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {showFill && <path d={fillPath} fill={fill} />}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={2.5} fill={stroke} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// AreaChart — bigger chart for dashboard hero
// ─────────────────────────────────────────────────────────────
function AreaChart({ data, width = 360, height = 120, accent = 'var(--accent)' }) {
  if (!data || !data.length) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const padX = 4, padTop = 8, padBottom = 18;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padTop + (1 - (d.value - min) / range) * innerH;
    return [x, y];
  });
  const linePath = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
  const fillPath = `${linePath} L${points[points.length - 1][0]},${padTop + innerH} L${points[0][0]},${padTop + innerH} Z`;

  // Zero baseline
  const zeroY = (() => {
    if (min > 0 || max < 0) return null;
    return padTop + (1 - (0 - min) / range) * innerH;
  })();

  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ac-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* horizontal gridlines */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={padX} x2={width - padX}
              y1={padTop + p * innerH} y2={padTop + p * innerH}
              stroke="var(--line)" strokeDasharray="2 4" />
      ))}
      {/* zero baseline */}
      {zeroY !== null && (
        <line x1={padX} x2={width - padX} y1={zeroY} y2={zeroY}
              stroke="var(--line-strong)" strokeDasharray="2 3" />
      )}
      {/* area */}
      <path d={fillPath} fill="url(#ac-grad)" />
      {/* line */}
      <path d={linePath} fill="none" stroke={accent} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
      {/* dots on each session */}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2}
                fill={i === points.length - 1 ? accent : 'var(--bg-1)'}
                stroke={accent} strokeWidth="1.2" />
      ))}
      {/* x labels — first / mid / last */}
      {[0, Math.floor(data.length / 2), data.length - 1].map(idx => (
        <text key={idx} x={points[idx][0]} y={height - 4}
              fontSize="10" fill="var(--fg-3)"
              fontFamily="var(--font-mono)"
              textAnchor={idx === 0 ? 'start' : idx === data.length - 1 ? 'end' : 'middle'}>
          {data[idx].label}
        </text>
      ))}
      {/* highlight dot value */}
      <circle cx={last[0]} cy={last[1]} r="4.5" fill={accent} />
      <circle cx={last[0]} cy={last[1]} r="7" fill={accent} fillOpacity="0.18" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom NavBar (mobile)
// ─────────────────────────────────────────────────────────────
function BottomNav({ active = 'home', onTab }) {
  const tabs = [
    { id: 'home',     icon: 'home',  label: 'Home' },
    { id: 'sessions', icon: 'list',  label: 'Sessions' },
    { id: 'settle',   icon: 'scale', label: 'Settle-up' },
    { id: 'members',  icon: 'users', label: 'Members' },
    { id: 'profile',  icon: 'user',  label: 'Profile' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 8px 6px',
      background: 'rgba(10,10,11,0.85)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '0.5px solid var(--line-strong)',
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <button key={t.id} onClick={() => onTab && onTab(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 0',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: on ? 'var(--accent)' : 'var(--fg-2)',
              minHeight: 44,
            }}>
            <Icon name={t.icon} size={20} strokeWidth={on ? 2 : 1.6} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500, letterSpacing: 0.02 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top header (mobile) — club switcher + bell + avatar
// ─────────────────────────────────────────────────────────────
function MobileHeader({ club = "Late Night Felt", role = "Host", notifications = 2, onMenu }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px 6px',
    }}>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: 'none', padding: '4px 4px',
        color: 'var(--fg-0)', cursor: 'pointer',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg, #2a1f0e, #4a3618)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)',
          boxShadow: '0 0 0 0.5px var(--accent-ring) inset',
        }}>
          <Icon name="spade" size={14} strokeWidth={1.8} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600 }}>{club}</span>
          <span style={{ fontSize: 11, color: 'var(--fg-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {role} · 11 members
          </span>
        </span>
        <Icon name="chevD" size={14} color="var(--fg-2)" />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{
          position: 'relative',
          width: 36, height: 36, borderRadius: 10,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--fg-1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="bell" size={18} />
          {notifications > 0 && (
            <span style={{
              position: 'absolute', top: 7, right: 7,
              width: 7, height: 7, borderRadius: 999,
              background: 'var(--accent)',
              boxShadow: '0 0 0 2px var(--bg-0)',
            }} />
          )}
        </button>
        <PlayerAvatar name="Yakir Sneh" size={32} you />
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, MoneyDisplay, fmtMoney,
  PlayerAvatar, initials, avatarColor,
  SessionTypeIcon, StatusBadge, EmptyState,
  Sparkline, AreaChart,
  BottomNav, MobileHeader,
});
