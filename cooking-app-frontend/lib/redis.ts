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
    lazyConnect: true,
    connectTimeout: 5_000,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy(times) {
      return Math.min(times * 200, 2_000);
    },
  });

  redis.on("error", (error) => {
    logger.error("Redis connection error", {
      message: error.message,
    });
  });

  return redis;
}
