import { Queue } from "bullmq";
import { redis } from "./redis";

export type OcrJobData = { importId: string };

declare global {
  // eslint-disable-next-line no-var
  var __ocrQueue: Queue<OcrJobData> | undefined;
}

const queue =
  globalThis.__ocrQueue ??
  new Queue<OcrJobData>("ocr", { connection: redis });

if (process.env.NODE_ENV !== "production") globalThis.__ocrQueue = queue;

export async function enqueueOcrJob(importId: string) {
  await queue.add(
    "ocr-import",
    { importId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    }
  );
}
