import { configureApiClient } from '@/lib/api-client';
import { AuthError } from '@/auth/auth';

/**
 * The ERP server URL is entered on the login page (per deployment), not baked
 * in at build time. It is applied to the generated API client before any
 * request and persisted in `localStorage` after a successful login, so the
 * next visit reconfigures the client automatically (see `src/main.tsx`).
 */

const STORAGE_KEY = 'minimal.server-url';

export function getStoredServerUrl(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeServerUrl(serverUrl: string) {
  try {
    localStorage.setItem(STORAGE_KEY, serverUrl);
  } catch {
    // Private mode etc. — the login simply won't survive a reload.
  }
}

export function clearStoredServerUrl() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Normalize and validate a user-entered server URL: trim, default the scheme
 * to `https://`, require http(s), drop trailing slashes. Throws an `AuthError`
 * (via the caller's context) on anything unusable.
 */
export function normalizeServerUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new AuthError('Please enter the ERP server URL.');
  }
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new AuthError('This is not a valid URL.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AuthError('The server URL must use https:// (or http://).');
  }
  return url.origin + (url.pathname === '/' ? '' : url.pathname.replace(/\/+$/, ''));
}

/** Normalize + validate and immediately point the API client at the server. */
export function applyServerUrl(raw: string): string {
  const serverUrl = normalizeServerUrl(raw);
  configureApiClient({ baseUrl: serverUrl });
  return serverUrl;
}
