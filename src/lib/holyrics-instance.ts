/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Holyrics Control Server Client Library
 * Based on HOLYRICS_SERVER_URL environment variable.
 */

export const HOLYRICS_SERVER_URL = import.meta.env.VITE_HOLYRICS_SERVER_URL || "http://localhost:3000";

/**
 * Custom fetch instance used by Orval-generated hooks.
 * Pre-configures the base URL and headers for the Holyrics Control Server.
 */
export const holyricsInstance = async <T>(
  { url, method, params, data, headers }: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: any;
    data?: any;
    headers?: any;
  },
  config?: RequestInit
): Promise<T> => {
  const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
  const fullUrl = `${HOLYRICS_SERVER_URL}${url}${queryParams}`;

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    ...config,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Holyrics API Error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
};

// This file is used as a mutator for Orval.
// It should not import from the generated API to avoid circular dependencies.
