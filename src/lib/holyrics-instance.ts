/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Holyrics Control Server Client Library
 * Based on HOLYRICS_SERVER_URL environment variable.
 */

export const HOLYRICS_SERVER_URL = import.meta.env.VITE_HOLYRICS_SERVER_URL || "http://localhost:3000";

console.log('🔌 Holyrics API Instance Loaded');

/**
 * Custom fetch instance used by Orval-generated hooks.
 * Pre-configures the base URL and headers for the Holyrics Control Server.
 */
export const holyricsInstance = async <T>(
  url: string,
  config: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    params?: any;
    data?: any;
    headers?: any;
  } & RequestInit
): Promise<T> => {
  const { method, params, data, headers, ...restConfig } = config;
  const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
  const baseUrl = HOLYRICS_SERVER_URL.endsWith('/') 
    ? HOLYRICS_SERVER_URL.slice(0, -1) 
    : HOLYRICS_SERVER_URL;
  
  const fullUrl = `${baseUrl}${url}${queryParams}`;

  console.group(`🚀 Holyrics API Request: [${method}] ${url}`);
  console.log('Full URL:', fullUrl);
  if (params) console.log('Params:', params);
  if (data) console.log('Data:', data);
  console.groupEnd();

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
      ...restConfig,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`❌ Holyrics API Error (${response.status}):`, errorText);
      throw new Error(`Holyrics API Error (${response.status}): ${errorText}`);
    }

    if (response.status === 204) {
      console.log('✅ Holyrics API Success: 204 No Content');
      return {
        data: {} as any,
        status: 204,
        headers: response.headers,
      } as any;
    }

    const text = await response.text();
    const result = text ? JSON.parse(text) : ({} as T);
    console.log('✅ Holyrics API Success:', result);
    
    return {
      data: result,
      status: response.status,
      headers: response.headers,
    } as any;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return Promise.reject(error);
    }
    console.error('❌ Holyrics API Fetch Error:', error);
    throw error;
  }
};

// This file is used as a mutator for Orval.
// It should not import from the generated API to avoid circular dependencies.
