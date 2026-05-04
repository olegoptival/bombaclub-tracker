import { Queue, Worker, type Job } from "bullmq";
import { redis } from "../redis";
import { log } from "../log";
import { db } from "../db";
import { runOcr } from "../ocr/run";

export const OCR_QUEUE_NAME = "ocr";

export type OcrJobData = { importId: string };

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
        const t0 = Date.now();
        const outcome = await runOcr(imp.image_url);
        const elapsedMs = Date.now() - t0;
        jobLog.info({ outcome: outcome.kind, elapsedMs }, "OCR call finished");

        if (outcome.kind === "success") {
          // Periodicity from the table block (may be null in some screens)
          const periodStart = outcome.result.table.period_start
            ? new Date(outcome.result.table.period_start)
            : null;
          const periodEnd = outcome.result.table.period_end
            ? new Date(outcome.result.table.period_end)
            : null;

          await db.ocr_imports.update({
            where: { id: imp.id },
            data: {
              status: "parsed",
              processed_at: new Date(),
              provider: MODEL_NAME,
              raw_response: { text: outcome.rawText },
              parsed_data: outcome.result as unknown as object,
              snapshot_period_start: periodStart,
              snapshot_period_end: periodEnd,
              confidence_score: outcome.result.validation.balance_ok ? 0.95 : 0.6,
            },
          });
          jobLog.info(
            { players: outcome.result.players.length, balanceOk: outcome.result.validation.balance_ok },
            "OCR import parsed"
          );
          return;
        }

        if (outcome.kind === "not_a_game_screen") {
          await db.ocr_imports.update({
            where: { id: imp.id },
            data: {
              status: "failed",
              processed_at: new Date(),
              provider: MODEL_NAME,
              raw_response: { text: outcome.rawText },
              error_message: `Not a ClubGG game screen: ${outcome.description}`,
            },
          });
          jobLog.warn({ description: outcome.description }, "Not a game screen");
          return;
        }

        // invalid_response
        await db.ocr_imports.update({
          where: { id: imp.id },
          data: {
            status: "failed",
            processed_at: new Date(),
            provider: MODEL_NAME,
            raw_response: { text: outcome.rawText },
            error_message: `Invalid OCR response: ${outcome.reason}`,
          },
        });
        jobLog.warn({ reason: outcome.reason }, "Invalid OCR response");
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
      concurrency: 1,
    }
  );

  worker.on("ready", () => log.info({ queue: OCR_QUEUE_NAME }, "Worker ready"));
  worker.on("error", (err) =>
    log.error({ err, queue: OCR_QUEUE_NAME }, "Worker error")
  );
}

const MODEL_NAME = "claude-sonnet-4-5";
