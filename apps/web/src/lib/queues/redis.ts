import IORedis from "ioredis";

const url = process.env.REDIS_URL ?? "redis://localhost:6379";

declare global {
  // eslint-disable-next-line no-var
  var __webRedis: IORedis | undefined;
}

export const redis =
  globalThis.__webRedis ??
  new IORedis(url, {
    maxRetriesPerRequest: null, // BullMQ requires this
  });

if (process.env.NODE_ENV !== "production") globalThis.__webRedis = redis;
