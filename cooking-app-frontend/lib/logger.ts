type LogLevel = "info" | "warn" | "error";

const formatLog = (
  level: LogLevel,
  message: string,
  data?: unknown,
): [string, unknown] => {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level.toUpperCase()}] ${message}`, data ?? ""];
};

export const logger = {
  info: (message: string, data?: unknown) =>
    console.info(...formatLog("info", message, data)),

  warn: (message: string, data?: unknown) =>
    console.warn(...formatLog("warn", message, data)),

  error: (message: string, data?: unknown) =>
    console.error(...formatLog("error", message, data)),
};
