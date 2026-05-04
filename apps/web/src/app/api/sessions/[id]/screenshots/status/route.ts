import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const dbSession = await db.sessions.findUnique({
    where: { id: sessionId },
    select: { host_id: true },
  });
  if (!dbSession) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
  if (dbSession.host_id !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const imports = await db.ocr_imports.findMany({
    where: { session_id: sessionId },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      status: true,
      error_message: true,
      parsed_data: true,
    },
  });

  const items = imports.map((i) => {
    let preview: { table_name?: string; players_count?: number; balance_ok?: boolean } | null = null;
    if (i.status === "parsed" && i.parsed_data && typeof i.parsed_data === "object") {
      const pd = i.parsed_data as {
        table?: { name?: string };
        players?: unknown[];
        validation?: { balance_ok?: boolean };
      };
      preview = {
        table_name: pd.table?.name ?? undefined,
        players_count: Array.isArray(pd.players) ? pd.players.length : undefined,
        balance_ok: pd.validation?.balance_ok,
      };
    }
    return {
      id: i.id,
      status: i.status,
      error_message: i.error_message,
      preview,
    };
  });

  return NextResponse.json({ items });
}
