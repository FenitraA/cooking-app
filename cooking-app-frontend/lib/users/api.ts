import { BASE_URL } from "../variables";
import {
  AppUser,
  AppUserApiResponse,
  AppUserPasswordChange,
  AppUserUsernameChange,
} from "./types";
import { apiFetch } from "../api-client";

export async function fetchConnectedUser(): Promise<AppUser> {
  return apiFetch<AppUserApiResponse>(
    `${BASE_URL}/proxy/auth/me`,
  );
}

export async function fetchHealth(): Promise<unknown> {
  return apiFetch<unknown>(
    `${BASE_URL}/proxy/auth/health`,
  );
}

export async function changeUserPassword(
  body: AppUserPasswordChange,
): Promise<AppUser> {
  return apiFetch<AppUser>(
    `${BASE_URL}/proxy/users/change-password`,
    {
      method: "PATCH",
      json: body,
    },
  );
}

export async function changeUsername(
  body: AppUserUsernameChange,
): Promise<AppUser> {
  return apiFetch<AppUser>(
    `${BASE_URL}/proxy/users/change-username`,
    {
      method: "PATCH",
      json: body,
    },
  );
}