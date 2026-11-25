import { createHash, randomUUID } from "node:crypto";

import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { UnauthorizedError } from "@/lib/errors";

export type RefreshResult = {
  cookieHeader: string;
  setCookies: string[];
};

const KEY_PREFIX = "myapp:auth:refresh:v1";

const RESULT_TTL_MS = 5_000;
const LOCK_TTL_MS = 20_000;
const WAIT_TIMEOUT_MS = 12_000;
const POLL_INTERVAL_MS = 100;

// Only the owner of a lock can release it.
const RELEASE_LOCK_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  end
  return 0
`;

export class RefreshWaitTimeoutError extends Error {
  constructor() {
    super("Timed out waiting for another refresh operation");
    this.name = "RefreshWaitTimeoutError";
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRefreshFingerprint(cookieHeader: string): string {
  const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);

  if (!match?.[1]) {
    throw new UnauthorizedError();
  }

  const fingerprint = createHash("sha256").update(match[1]).digest("hex");

  return fingerprint;
}

function getRedisKeys(fingerprint: string) {
  const base = `${KEY_PREFIX}:${fingerprint}`;

  return {
    lock: `${base}:lock`,
    result: `${base}:result`,
  };
}

function parseRefreshResult(value: string): RefreshResult {
  const parsed = JSON.parse(value);

  if (
    typeof parsed?.cookieHeader !== "string" ||
    !Array.isArray(parsed?.setCookies) ||
    !parsed.setCookies.every((cookie: unknown) => typeof cookie === "string")
  ) {
    throw new Error("Invalid cached refresh result");
  }

  return parsed as RefreshResult;
}

async function getCachedResult(
  resultKey: string,
): Promise<RefreshResult | null> {
  const redis = getRedis();

  const cached = await redis.get(resultKey);

  return cached ? parseRefreshResult(cached) : null;
}

export async function coordinateRefresh({
  cookieHeader,
  endpoint,
  executeRefresh,
}: {
  cookieHeader: string;
  endpoint: string;
  executeRefresh: () => Promise<RefreshResult>;
}): Promise<RefreshResult> {
  const redis = getRedis();

  const fingerprint = getRefreshFingerprint(cookieHeader);

  const { lock: lockKey, result: resultKey } = getRedisKeys(fingerprint);

  // 1. Fast path: an earlier instance already completed the refresh.
  const cached = await getCachedResult(resultKey);

  if (cached) {
    return cached;
  }

  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let hasWaited = false;

  // 2. Attempt to acquire the distributed lock.
  while (Date.now() < deadline) {
    const ownerId = randomUUID();

    const acquired = await redis.set(lockKey, ownerId, "PX", LOCK_TTL_MS, "NX");

    if (acquired === "OK") {
      try {
        // Another request may have completed just before we acquired
        // the lock. Always check the result again.
        const recentResult = await getCachedResult(resultKey);

        if (recentResult) {
          return recentResult;
        }

        // 3. We own the lock. Perform the actual refresh.

        const refreshed = await executeRefresh();

        // 4. Publish the result BEFORE releasing the lock.
        await redis.set(
          resultKey,
          JSON.stringify(refreshed),
          "PX",
          RESULT_TTL_MS,
        );
        return refreshed;
      } finally {
        // 5. Release only if we still own the lock.
        try {
          await redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, ownerId);
        } catch (error) {
          // The lock will eventually expire automatically.
          logger.error("Failed to release refresh lock", {
            endpoint,
            error,
          });
        }
      }
    }

    // 6. Someone else owns the lock.
    if (!hasWaited) {
      hasWaited = true;
    }

    // Check whether the other instance has published its result.
    const result = await getCachedResult(resultKey);

    if (result) {
      return result;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new RefreshWaitTimeoutError();
}
