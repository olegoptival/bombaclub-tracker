"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/audit", label: "Audit log", disabled: true },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      style={{
        width: 200,
        padding: "20px 12px",
        borderRight: "0.5px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {items.map((it) => {
        const active = pathname === it.href || pathname?.startsWith(it.href + "/");
        const disabled = it.disabled;
        const styles: React.CSSProperties = {
          display: "block",
          padding: "8px 12px",
          fontSize: 14,
          fontWeight: 500,
          borderRadius: "var(--r-sm)",
          color: disabled ? "var(--fg-3)" : active ? "var(--fg-0)" : "var(--fg-1)",
          background: active ? "var(--bg-2)" : "transparent",
          textDecoration: "none",
          pointerEvents: disabled ? "none" : "auto",
          opacity: disabled ? 0.5 : 1,
        };
        return disabled ? (
          <span key={it.href} style={styles}>
            {it.label}
          </span>
        ) : (
          <Link key={it.href} href={it.href} style={styles}>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
