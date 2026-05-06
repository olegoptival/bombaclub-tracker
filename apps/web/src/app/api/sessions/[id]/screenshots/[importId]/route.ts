import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getS3 } from "@/lib/s3";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; importId: string }> }
) {
  const { id: sessionId, importId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const dbSession = await db.sessions.findUnique({
    where: { id: sessionId },
    select: { host_id: true, status: true, type: true },
  });
  if (!dbSession) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (dbSession.host_id !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (dbSession.status !== "created") {
    return NextResponse.json({ error: "session is not in draft state" }, { status: 400 });
  }

  const imp = await db.ocr_imports.findUnique({
    where: { id: importId },
    select: { id: true, session_id: true, image_url: true },
  });
  if (!imp || imp.session_id !== sessionId) {
    return NextResponse.json({ error: "import not found" }, { status: 404 });
  }

  // 1. Delete file from MinIO (best effort — keep going even if it fails)
  const m = /^s3:\/\/([^/]+)\/(.+)$/.exec(imp.image_url);
  if (m) {
    const [, bucket, key] = m;
    try {
      await getS3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (err) {
      console.warn("failed to delete S3 object", { key, err });
    }
  }

  // 2. Find participants who were created ONLY because of this import.
  //    A participant is a "child of this import" if all their ocr_screen_results
  //    belong to this import_id. After deleting screen_results, such participants
  //    will have zero results and (importantly) no buy_in/cash_out events either.
  await db.$transaction(async (tx) => {
    // Cascade: deleting ocr_imports also deletes its ocr_screen_results
    await tx.ocr_imports.delete({ where: { id: importId } });

    // Now find participants for this session that have no remaining
    // screen_results, no buy_in_events, and no cash_out_events.
    const orphans = await tx.session_participants.findMany({
      where: {
        session_id: sessionId,
        ocr_screen_results: { none: {} },
        buy_in_events: { none: {} },
        cash_out_events: { none: {} },
      },
      select: { id: true },
    });
    if (orphans.length > 0) {
      await tx.session_participants.deleteMany({
        where: { id: { in: orphans.map((o) => o.id) } },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
