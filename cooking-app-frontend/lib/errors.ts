export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, message?: string, status = 400) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message?: string) {
    super("errors.unauthorized", message, 401);
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong";
}
