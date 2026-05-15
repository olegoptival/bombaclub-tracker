"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";

const HIDE_ON = ["/login", "/first-login"];

export function AppChrome({
  role,
  isSuperuser,
  clubName,
  displayName,
}: {
  role: "host" | "player" | null;
  isSuperuser: boolean;
  clubName: string | null;
  displayName: string;
}) {
  const pathname = usePathname();
  if (!role) return null;
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }
  return (
    <>
      <BottomNav role={role} isSuperuser={isSuperuser} />
      <Sidebar
        role={role}
        isSuperuser={isSuperuser}
        clubName={clubName}
        displayName={displayName}
      />
    </>
  );
}
