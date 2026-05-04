import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getAppContext } from "@/lib/session/context";
import { db } from "@/lib/db";
import { UploadWizard } from "./wizard";

export const metadata = { title: "Upload screenshots · Bombaclub Tracker" };
export const dynamic = "force-dynamic";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getAppContext();

  // Load session and verify access
  const session = await db.sessions.findUnique({
    where: { id },
    include: {
      ocr_imports: {
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!session) notFound();

  // Only the host of THIS session can upload
  if (session.host_id !== ctx.user.id) {
    redirect("/");
  }

  if (session.type !== "online") {
    // wrong wizard for this session type
    redirect(`/sessions/${id}`);
  }

  if (session.status !== "created") {
    // session already finalized
    redirect(`/sessions/${id}`);
  }

  return (
    <main style={{ minHeight: "100vh", padding: "20px 16px 100px" }}>
      <div style={{ maxWidth: 460, marginInline: "auto" }}>
        <Link
          href="/sessions/new"
          style={{ fontSize: 13, color: "var(--fg-2)", textDecoration: "none" }}
        >
          ← Back
        </Link>

        <div style={{ marginTop: 18, marginBottom: 22 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            New online session
          </h1>
          <p style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Drop your ClubGG end-of-table screenshots. We&apos;ll OCR each one to
            pull players and stacks.
          </p>
        </div>

        <UploadWizard
          sessionId={session.id}
          existingImports={session.ocr_imports.map((i) => ({
            id: i.id,
            status: i.status,
            image_url: i.image_url,
            error_message: i.error_message,
            created_at: i.created_at.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
