import { Queue, Worker, type Job } from "bullmq";
import { redis } from "../redis";
import { log } from "../log";
import { db } from "../db";

export const OCR_QUEUE_NAME = "ocr";

export type OcrJobData = {
  importId: string;
};

// Producer (used by web app to enqueue work — but web has its own copy of this
// const, see src/lib/queues/ocr-producer.ts in apps/web).
// Here we only need the consumer side.
export const ocrQueue = new Queue<OcrJobData>(OCR_QUEUE_NAME, {
  connection: redis,
});

export function startOcrWorker() {
  const worker = new Worker<OcrJobData>(
    OCR_QUEUE_NAME,
    async (job: Job<OcrJobData>) => {
      const { importId } = job.data;
      const jobLog = log.child({ jobId: job.id, importId });

      jobLog.info("OCR job picked up");

      const imp = await db.ocr_imports.findUnique({
        where: { id: importId },
        select: {
          id: true,
          status: true,
          image_url: true,
          session_id: true,
        },
      });
      if (!imp) {
        jobLog.warn("ocr_import not found, skipping");
        return;
      }
      if (imp.status !== "pending") {
        jobLog.warn({ status: imp.status }, "ocr_import not pending, skipping");
        return;
      }

      // Mark as processing
      await db.ocr_imports.update({
        where: { id: imp.id },
        data: { status: "processing" },
      });

      try {
        // TODO Stage 4.4: actual OCR via Claude Vision
        // For now: stub success after 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));

        await db.ocr_imports.update({
          where: { id: imp.id },
          data: {
            status: "parsed",
            processed_at: new Date(),
            provider: "stub",
            parsed_data: { stub: true },
          },
        });

        jobLog.info("OCR job completed (stub)");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await db.ocr_imports.update({
          where: { id: imp.id },
          data: {
            status: "failed",
            processed_at: new Date(),
            error_message: msg,
          },
        });
        jobLog.error({ err }, "OCR job failed");
        throw err;
      }
    },
    {
      connection: redis,
      concurrency: 1, // 1 OCR at a time on a 2GB VPS
    }
  );

  worker.on("ready", () => log.info({ queue: OCR_QUEUE_NAME }, "Worker ready"));
  worker.on("error", (err) =>
    log.error({ err, queue: OCR_QUEUE_NAME }, "Worker error")
  );
}
