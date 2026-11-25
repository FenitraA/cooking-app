import Redis from "ioredis";
import { logger } from "@/lib/logger";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL environment variable is missing");
  }

  redis = new Redis(redisUrl, {
    connectTimeout: 5_000,
    maxRetriesPerRequest: 1,

    // Let ioredis queue commands until the connection is ready.
    // enableOfflineQueue defaults to true.

    retryStrategy(times) {
      return Math.min(times * 200, 2_000);
    },
  });

  redis.on("connect", () => {
    logger.info("Redis connection established");
  });

  redis.on("ready", () => {
    logger.info("Redis is ready to accept commands");
  });

  redis.on("error", (error) => {
    logger.error("Redis connection error", {
      message: error.message,
    });
  });

  redis.on("close", () => {
    logger.warn("Redis connection closed");
  });

  redis.on("reconnecting", (delay: number) => {
    logger.warn("Redis reconnecting", { delay });
  });

  return redis;
}
