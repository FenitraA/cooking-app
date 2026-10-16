import { UnauthorizedError } from "@/lib/errors";
import { keysToCamelCase, keysToSnakeCase } from "./case-converter";
import type { CamelCasedPropertiesDeep } from "./case-types";

type ApiRequestInit = Omit<RequestInit, "body"> & {
  /**
   * JSON payload expressed using camelCase keys.
   */
  json?: unknown;
};

export async function apiFetch<TResponse>(
  url: string,
  options: ApiRequestInit = {},
): Promise<CamelCasedPropertiesDeep<TResponse>> {
  const { json, headers: customHeaders, ...requestOptions } = options;

  const headers = new Headers(customHeaders);
  let body: BodyInit | undefined;

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(keysToSnakeCase(json));
  }

  const response = await fetch(url, {
    ...requestOptions,
    headers,
    body,
    credentials: options.credentials ?? "include",
  });

  if (response.status === 401) {
    throw new UnauthorizedError("Unauthorized");
  }

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || `API request failed with status ${response.status}`,
    );
  }

  // Handle responses without a body, such as HTTP 204.
  if (
    response.status === 204 ||
    response.status === 205
  ) {
    return undefined as CamelCasedPropertiesDeep<TResponse>;
  }

  // Handle other successful responses without a body.
  const contentLength = response.headers.get("Content-Length");

  if (contentLength === "0") {
    return undefined as CamelCasedPropertiesDeep<TResponse>;
  }

  const contentType = response.headers.get("Content-Type");

  if (!contentType?.includes("application/json")) {
    return (await response.text()) as CamelCasedPropertiesDeep<TResponse>;
  }

  const data: unknown = await response.json();

  return keysToCamelCase(data) as CamelCasedPropertiesDeep<TResponse>;
}