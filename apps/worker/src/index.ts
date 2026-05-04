import { log } from "./log";
import { startOcrWorker } from "./queues/ocr";

async function main() {
  log.info("Worker booting…");

  startOcrWorker();

  log.info("Worker ready. Listening for jobs.");

  // Graceful shutdown
  const shutdown = (signal: string) => {
    log.info({ signal }, "Shutting down…");
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  log.error({ err }, "Worker crashed");
  process.exit(1);
});
