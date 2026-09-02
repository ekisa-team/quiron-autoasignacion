import { env } from "$env/dynamic/private";

const BASE_URL = env.API_TUNNEL_URL || "http://localhost:8080/api/v1";

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<T | null> {
  try {
    const url = new URL(
      `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
    );
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[apiGet Error] ${endpoint}:`, error);
    return null;
  }
}

export async function apiPost<T, B = Record<string, unknown>>(
  endpoint: string,
  body: B,
): Promise<{ data: T | null; status: number; ok: boolean }> {
  try {
    const res = await fetch(
      `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const ok = res.ok;
    const status = res.status;
    const data = (await res.json().catch(() => null)) as T | null;

    return { data, status, ok };
  } catch (error) {
    console.error(`[apiPost Error] ${endpoint}:`, error);
    return { data: null, status: 500, ok: false };
  }
}

export async function apiDelete<T>(
  endpoint: string,
): Promise<{ data: T | null; status: number; ok: boolean }> {
  try {
    const res = await fetch(
      `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );

    const ok = res.ok;
    const status = res.status;
    const data = (await res.json().catch(() => null)) as T | null;

    return { data, status, ok };
  } catch (error) {
    console.error(`[apiDelete Error] ${endpoint}:`, error);
    return { data: null, status: 500, ok: false };
  }
}
