import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./tokens.css";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { AppChrome } from "@/components/ui/app-chrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bombaclub Tracker",
  description: "Track poker results in your private club",
};

async function resolveChrome(): Promise<{
  role: "host" | "player" | null;
  isSuperuser: boolean;
}> {
  const session = await auth();
  if (!session?.user) return { role: null, isSuperuser: false };
  const isSuperuser = !!session.user.isSuperuser;
  // Pick any active membership to decide host vs player tab set.
  const m = await db.club_members.findFirst({
    where: { user_id: session.user.id, status: "active" },
    select: { role: true },
    orderBy: { role: "desc" }, // host before player
  });
  const role = m ? (m.role as "host" | "player") : "player";
  return { role, isSuperuser };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chrome = await resolveChrome();
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <AppChrome role={chrome.role} isSuperuser={chrome.isSuperuser} />
      </body>
    </html>
  );
}
