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
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "12px 0 16px",
        borderBottom: "0.5px solid var(--line)",
        marginBottom: 24,
      }}
    >
      {items.map((it) => {
        const active =
          pathname === it.href || pathname?.startsWith(it.href + "/");
        const styles: React.CSSProperties = {
          padding: "6px 12px",
          fontSize: 13,
          fontWeight: 500,
          borderRadius: 999,
          color: it.disabled
            ? "var(--fg-3)"
            : active
              ? "var(--fg-0)"
              : "var(--fg-1)",
          background: active ? "var(--bg-2)" : "transparent",
          textDecoration: "none",
          pointerEvents: it.disabled ? "none" : "auto",
          opacity: it.disabled ? 0.5 : 1,
          whiteSpace: "nowrap",
        };
        return it.disabled ? (
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
