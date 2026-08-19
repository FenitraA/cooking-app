import { UnauthorizedError } from "@/lib/errors";
import { BASE_URL } from "../variables";
import { AppUser, AppUserPasswordChange, AppUserUsernameChange } from "./types";
import { safeReadError } from "../utils";

export async function fetchConnectedUser(): Promise<AppUser> {
  const userRes = await fetch(
    `${BASE_URL}/proxy/auth/me`,
  );

  if (userRes.status === 401) {
    throw new UnauthorizedError();
  }

  if (!userRes.ok) {
    const msg = await safeReadError(userRes);
    throw new Error(msg || "Failed to fetch me");
  }

  const user: AppUser = await userRes.json();
  return user;
}

export async function fetchHealth() {
  const res = await fetch(
    `${BASE_URL}/proxy/auth/health`,
  );

  if (res.status === 401) {
    throw new UnauthorizedError();
  }

  if (!res.ok) {
    const msg = await safeReadError(res);
    throw new Error(msg || "Error while checking heatlh");
  }

  const user: AppUser = await res.json();
  return user;
}

export async function changeUserPassword(body: AppUserPasswordChange) {
  const res = await fetch(
    `${BASE_URL}/proxy/users/change-password`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  return res.json();
}

export async function changeUsername(body: AppUserUsernameChange) {
  const res = await fetch(
    `${BASE_URL}/proxy/users/change-username`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    },
  );

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  return res.json();
}