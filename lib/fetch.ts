/**
 * Shared API fetch utilities for Cerita Kita
 * Replaces scattered `const fetcher = (url) => fetch(url).then(res => res.json())`
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message = `HTTP ${status} Error`) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

/**
 * Base API fetch with error handling + timeout support.
 * Throws ApiError on non-OK responses.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (options?.timeout) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller!.abort(), options.timeout);
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller?.signal ?? options?.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(
        response.status,
        text || `HTTP ${response.status} ${response.statusText}`
      );
    }

    return (await response.json()) as T;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/** SWR-compatible fetcher */
export const swrFetcher = <T,>(url: string) => apiFetch<T>(url);

/** Convenience GET */
export function apiGet<T>(url: string, options?: RequestInit & { timeout?: number }) {
  return apiFetch<T>(url, options);
}

/** Convenience POST */
export function apiPost<T>(
  url: string,
  body: unknown,
  options?: Omit<RequestInit, 'body' | 'method'>
) {
  return apiFetch<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    ...options,
  });
}

/** Convenience PATCH */
export function apiPatch<T>(
  url: string,
  body: unknown,
  options?: Omit<RequestInit, 'body' | 'method'>
) {
  return apiFetch<T>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    ...options,
  });
}

/** Convenience PUT */
export function apiPut<T>(
  url: string,
  body: unknown,
  options?: Omit<RequestInit, 'body' | 'method'>
) {
  return apiFetch<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(body),
    ...options,
  });
}

/** Convenience DELETE */
export function apiDelete<T>(url: string, options?: Omit<RequestInit, 'method'>) {
  return apiFetch<T>(url, { method: 'DELETE', ...options });
}

/** Convenience GET (same as apiGet, for File/Upload routes that return blob) */
export async function apiFetchRaw(url: string, options?: RequestInit & { timeout?: number }) {
  let controller: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  if (options?.timeout) {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller!.abort(), options.timeout);
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller?.signal ?? options?.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ApiError(
        response.status,
        text || `HTTP ${response.status} ${response.statusText}`
      );
    }

    return response;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
