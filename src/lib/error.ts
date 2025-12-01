// src/lib/error.ts
import axios, { AxiosError } from "axios";

/**
 * Safely extract a human-friendly message from an unknown error.
 * Supports Axios errors with an expected response shape { message?: string }.
 */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // Narrow the AxiosError to a response body we expect (object with optional `message`)
    const aErr = err as AxiosError<{ message?: string }>;
    return aErr.response?.data?.message ?? aErr.message ?? "Request failed";
  }

  if (err instanceof Error) return err.message;

  return "Unknown error";
}
