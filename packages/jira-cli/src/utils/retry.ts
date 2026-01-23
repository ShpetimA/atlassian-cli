import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

export interface RetryConfig {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  retryableStatuses: [429, 500, 502, 503, 504],
};

interface ExtendedConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff with jitter: base * 2^attempt + random jitter
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

function isRetryable(error: AxiosError, retryableStatuses: number[]): boolean {
  // Network errors (no response)
  if (!error.response) {
    return error.code === "ECONNRESET" ||
           error.code === "ETIMEDOUT" ||
           error.code === "ENOTFOUND" ||
           error.code === "ECONNREFUSED" ||
           error.code === "EPIPE" ||
           error.message?.includes("timeout");
  }

  // Check if status is in retryable list
  return retryableStatuses.includes(error.response.status);
}

function getRetryAfter(error: AxiosError): number | null {
  const retryAfter = error.response?.headers?.["retry-after"];
  if (!retryAfter) return null;

  // If it's a number, it's seconds
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) return seconds * 1000;

  // If it's a date, calculate the difference
  const date = new Date(retryAfter);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

/**
 * Adds exponential backoff retry logic to an Axios instance.
 * Retries on: 429 (rate limit), 5xx (server errors), network errors.
 * Respects Retry-After headers when present.
 */
export function addRetryInterceptor(client: AxiosInstance, config: RetryConfig = {}): void {
  const { maxRetries, baseDelayMs, maxDelayMs, retryableStatuses } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const axiosConfig = error.config as ExtendedConfig | undefined;

      if (!axiosConfig) {
        return Promise.reject(error);
      }

      const retryCount = axiosConfig.__retryCount ?? 0;

      // Check if we should retry
      if (retryCount >= maxRetries || !isRetryable(error, retryableStatuses)) {
        return Promise.reject(error);
      }

      // Calculate delay
      let delay = calculateDelay(retryCount, baseDelayMs, maxDelayMs);

      // Respect Retry-After header if present
      const retryAfter = getRetryAfter(error);
      if (retryAfter !== null) {
        delay = Math.min(retryAfter, maxDelayMs);
      }

      // Increment retry count
      axiosConfig.__retryCount = retryCount + 1;

      // Wait and retry
      await sleep(delay);
      return client.request(axiosConfig);
    }
  );
}
