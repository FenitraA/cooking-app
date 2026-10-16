
function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

export function toCamelCase(value: string): string {
  return value.replace(/_([a-z0-9])/g, (_, char: string) =>
    char.toUpperCase(),
  );
}

export function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

export function keysToCamelCase<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => keysToCamelCase(item)) as T;
  }

  if (!isPlainObject(data)) {
    return data;
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      toCamelCase(key),
      keysToCamelCase(value),
    ]),
  ) as T;
}

export function keysToSnakeCase<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((item) => keysToSnakeCase(item)) as T;
  }

  if (!isPlainObject(data)) {
    return data;
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      toSnakeCase(key),
      keysToSnakeCase(value),
    ]),
  ) as T;
}
