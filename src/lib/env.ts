export const env = {
  /** Optional build-time default for the server URL input (no server URL is stored yet). */
  defaultApiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
} as const;
