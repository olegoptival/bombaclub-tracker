"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";
import { logoutAction } from "@/lib/actions/logout";

type Tab = { id: string; href: string; icon: IconName; label: string };

const BASE: Tab[] = [
  { id: "home", href: "/", icon: "home", label: "Home" },
  { id: "sessions", href: "/sessions", icon: "list", label: "Sessions" },
  { id: "week", href: "/week", icon: "trend", label: "Week" },
];

const CLUB: Tab = { id: "club", href: "/club/settings", icon: "scale", label: "Club" };
const PROFILE: Tab = { id: "profile", href: "/profile", icon: "user", label: "Profile" };
const ADMIN: Tab = { id: "admin", href: "/admin", icon: "zap", label: "Admin" };

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.href === "/") return pathname === "/";
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

export function Sidebar({
  role,
  isSuperuser,
  clubName,
  displayName,
}: {
  role: "host" | "player";
  isSuperuser: boolean;
  clubName: string | null;
  displayName: string;
}) {
  const pathname = usePathname();

  const navTabs: Tab[] = [...BASE];
  if (role === "host" || isSuperuser) navTabs.push(CLUB);

  const bottomTabs: Tab[] = [PROFILE];
  if (isSuperuser) bottomTabs.push(ADMIN);

  const showNewSession = role === "host" || isSuperuser;

  return (
    <aside
      className="pkr-sidebar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
        zIndex: 50,
        flexDirection: "column",
        background: "var(--bg-1)",
        borderRight: "0.5px solid var(--line)",
        padding: "20px 0 16px",
      }}
    >
      {/* Brand + club */}
      <div style={{ padding: "0 18px 18px", borderBottom: "0.5px solid var(--line)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: clubName ? 10 : 0,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "linear-gradient(135deg, #2a1f0e, #4a3618)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
              boxShadow: "0 0 0 0.5px var(--accent-ring) inset",
            }}
          >
            <Icon name="spade" size={14} strokeWidth={1.8} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.2 }}>
              Bombaclub
            </div>
            <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 1 }}>
              {displayName}
            </div>
          </div>
        </div>
        {clubName && (
          <div
            style={{
              fontSize: 11,
              color: "var(--fg-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginTop: 6,
            }}
          >
            {clubName}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 12px", display: "flex", flexDirection: "column", gap: 2, flex: 1, overflow: "auto" }}>
        {navTabs.map((tab) => {
          const on = isActive(pathname, tab);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: "var(--r-sm)",
                color: on ? "var(--fg-0)" : "var(--fg-1)",
                background: on ? "var(--bg-2)" : "transparent",
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: on ? 600 : 500,
              }}
            >
              <Icon name={tab.icon} size={16} strokeWidth={on ? 2 : 1.6} />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {showNewSession && (
          <Link
            href="/sessions/new"
            className="pkr-btn pkr-btn--primary"
            style={{
              marginTop: 14,
              height: 38,
              justifyContent: "center",
              fontSize: 13.5,
            }}
          >
            + New session
          </Link>
        )}
      </nav>

      {/* Bottom group: Profile + Admin + Sign out */}
      <div style={{ padding: "8px 12px 0", display: "flex", flexDirection: "column", gap: 2, borderTop: "0.5px solid var(--line)" }}>
        {bottomTabs.map((tab) => {
          const on = isActive(pathname, tab);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: "var(--r-sm)",
                color: on ? "var(--fg-0)" : "var(--fg-1)",
                background: on ? "var(--bg-2)" : "transparent",
                textDecoration: "none",
                fontSize: 13.5,
                fontWeight: on ? 600 : 500,
              }}
            >
              <Icon name={tab.icon} size={16} strokeWidth={on ? 2 : 1.6} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: "var(--r-sm)",
              color: "var(--fg-2)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 500,
              textAlign: "left",
            }}
          >
            <Icon name="arrowR" size={16} strokeWidth={1.6} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
