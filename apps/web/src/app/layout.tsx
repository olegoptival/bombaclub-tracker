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
  clubName: string | null;
  displayName: string;
}> {
  const session = await auth();
  if (!session?.user) {
    return { role: null, isSuperuser: false, clubName: null, displayName: "" };
  }
  const isSuperuser = !!session.user.isSuperuser;

  // Pick membership: prefer host, then active.
  const m = await db.club_members.findFirst({
    where: { user_id: session.user.id, status: "active" },
    select: { role: true, clubs: { select: { name: true } } },
    orderBy: { role: "desc" },
  });
  const role = m ? (m.role as "host" | "player") : "player";

  const user = await db.users.findUnique({
    where: { id: session.user.id },
    select: { display_name: true },
  });

  return {
    role,
    isSuperuser,
    clubName: m?.clubs.name ?? null,
    displayName: user?.display_name ?? "",
  };
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
        <AppChrome
          role={chrome.role}
          isSuperuser={chrome.isSuperuser}
          clubName={chrome.clubName}
          displayName={chrome.displayName}
        />
        <div className="pkr-app-shell">{children}</div>
      </body>
    </html>
  );
}
