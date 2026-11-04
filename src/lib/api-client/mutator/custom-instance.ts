export type CustomRequestInit = Omit<RequestInit, 'body'> & { body?: unknown };

export type ApiClientConfig = {
  /** Prefix for every request URL, e.g. `https://erp.example.com`. Defaults to same-origin (relative URLs). */
  baseUrl?: string;
  /** Provides auth headers (e.g. Basic/Bearer) attached to every request unless overridden per call. */
  getAuthHeaders?: () => Record<string, string>;
};

const config: { baseUrl: string; getAuthHeaders?: ApiClientConfig['getAuthHeaders'] } = {
  baseUrl: '',
  getAuthHeaders: undefined,
};

export function configureApiClient(next: ApiClientConfig): void {
  if (next.baseUrl !== undefined) {
    config.baseUrl = next.baseUrl.replace(/\/+$/, '');
  }
  if (next.getAuthHeaders !== undefined) {
    config.getAuthHeaders = next.getAuthHeaders;
  }
}

export const customInstance = async <T>(url: string, init?: CustomRequestInit): Promise<T> => {
  let { body } = init ?? {};
  // Auth headers first, so explicit per-call headers always win.
  const headers = new Headers(config.getAuthHeaders?.());
  for (const [key, value] of new Headers(init?.headers).entries()) {
    headers.set(key, value);
  }

  const isPlainObject =
    body !== undefined &&
    body !== null &&
    typeof body === 'object' &&
    !(body instanceof Blob) &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(body);

  if (isPlainObject) {
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const response = await fetch(`${config.baseUrl}${url}`, {
    ...init,
    headers,
    body: body as BodyInit | null | undefined,
  });

  const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
  const rawBody = [204, 205, 304].includes(response.status) ? null : await response.text();
  const data = rawBody === null ? null : contentType.includes('json') ? JSON.parse(rawBody) : rawBody;

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};

export default customInstance;
