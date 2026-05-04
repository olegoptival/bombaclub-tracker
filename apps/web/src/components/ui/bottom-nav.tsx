"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";

type Tab = { id: string; href: string; icon: IconName; label: string };

const TABS: Tab[] = [
  { id: "home",     href: "/",          icon: "home",  label: "Home"      },
  { id: "sessions", href: "/sessions",  icon: "list",  label: "Sessions"  },
  { id: "settle",   href: "/settle-up", icon: "scale", label: "Settle-up" },
  { id: "members",  href: "/members",   icon: "users", label: "Members"   },
  { id: "profile",  href: "/profile",   icon: "user",  label: "Profile"   },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.href === "/") return pathname === "/";
  return pathname.startsWith(tab.href);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 8px 6px",
        background: "rgba(10,10,11,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "0.5px solid var(--line-strong)",
      }}
      className="pkr-bottom-nav"
    >
      {TABS.map((tab) => {
        const on = isActive(pathname, tab);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "6px 0",
              color: on ? "var(--accent)" : "var(--fg-2)",
              textDecoration: "none",
              minHeight: 44,
              justifyContent: "center",
            }}
          >
            <Icon name={tab.icon} size={20} strokeWidth={on ? 2 : 1.6} />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: on ? 600 : 500,
                letterSpacing: "0.02em",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
