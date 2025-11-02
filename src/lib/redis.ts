import { createClient } from "redis";
import * as Sentry from "@sentry/nextjs";

const { logger } = Sentry;

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
};

export const redis =
  globalForRedis.redis ??
  createClient({
    url: process.env.REDIS_URL,
  });

redis.on("error", (err) => {
  Sentry.captureException(err);
  logger.error(logger.fmt`Redis Client Error: ${err.message}`);
});

// Connect if not already connected
if (!redis.isOpen) {
  redis.connect().catch((err) => {
    Sentry.captureException(err);
    logger.error(logger.fmt`Failed to connect to Redis: ${err.message}`);
  });
}

// Cache in development to avoid hot-reload issues
if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
