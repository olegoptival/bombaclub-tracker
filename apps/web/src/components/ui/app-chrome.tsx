"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";

const HIDE_ON = ["/login", "/first-login"];

export function AppChrome({
  role,
  isSuperuser,
}: {
  role: "host" | "player" | null;
  isSuperuser: boolean;
}) {
  const pathname = usePathname();
  if (!role) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return <BottomNav role={role} isSuperuser={isSuperuser} />;
}
