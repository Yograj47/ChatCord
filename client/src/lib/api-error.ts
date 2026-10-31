import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<{ message?: string | string[] }>(error)) return fallback;
  const message = error.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");
  return fallback;
}
