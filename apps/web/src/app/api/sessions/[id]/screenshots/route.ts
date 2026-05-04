import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { s3, S3_BUCKET } from "@/lib/s3";
import { enqueueOcrJob } from "@/lib/queues/ocr-producer";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Verify session exists, belongs to caller, is still draft, is online
  const dbSession = await db.sessions.findUnique({
    where: { id: sessionId },
    select: { id: true, host_id: true, status: true, type: true },
  });
  if (!dbSession) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
  if (dbSession.host_id !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (dbSession.type !== "online") {
    return NextResponse.json(
      { error: "screenshots only allowed for online sessions" },
      { status: 400 }
    );
  }
  if (dbSession.status !== "created") {
    return NextResponse.json(
      { error: "session is not in draft state" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 }
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `unsupported file type: ${file.type}` },
      { status: 415 }
    );
  }

  // Read into memory + hash + ext
  const buf = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buf).digest("hex");
  const ext = EXT_MAP[file.type];
  const key = `sessions/${sessionId}/${hash}.${ext}`;
  const imageUrl = `s3://${S3_BUCKET}/${key}`;

  // Idempotency: same hash for same session = the same screenshot, skip duplicate
  const existing = await db.ocr_imports.findFirst({
    where: { session_id: sessionId, image_hash: hash },
  });
  if (existing) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      import: {
        id: existing.id,
        status: existing.status,
        image_url: existing.image_url,
      },
    });
  }

  // Upload to MinIO
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buf,
      ContentType: file.type,
    })
  );

  // Insert ocr_imports row
  const imp = await db.ocr_imports.create({
    data: {
      session_id: sessionId,
      image_url: imageUrl,
      image_hash: hash,
      status: "pending",
      uploaded_by: session.user.id,
    },
    select: {
      id: true,
      status: true,
      image_url: true,
    },
  });

  await enqueueOcrJob(imp.id);

  return NextResponse.json({ ok: true, import: imp });
}
