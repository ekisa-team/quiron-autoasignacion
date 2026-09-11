export async function apiGet<T>(
  baseUrl: string,
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<T | null> {
  try {
    const url = new URL(
      `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
    );

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`[${res.status}] ${res.statusText} - ${url}`);
    }

    const data = await res.json();
    return data as T;
  } catch (error) {
    console.error(`[apiGet Error] ${endpoint}:`, error);
    throw error;
  }
}

export async function apiPost<T, B = Record<string, unknown>>(
  baseUrl: string,
  endpoint: string,
  body: B,
): Promise<{ data: T | null; status: number; ok: boolean }> {
  try {
    const res = await fetch(
      `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
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
    const data = await res.json();

    return { data, status, ok };
  } catch (error) {
    console.error(`[apiPost Error] ${endpoint}:`, error);
    throw error;
  }
}

export async function apiDelete<T>(
  baseUrl: string,
  endpoint: string,
): Promise<{ data: T | null; status: number; ok: boolean }> {
  try {
    const res = await fetch(
      `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
      },
    );

    const ok = res.ok;
    const status = res.status;
    const data = await res.json();

    return { data, status, ok };
  } catch (error) {
    console.error(`[apiDelete Error] ${endpoint}:`, error);
    throw error;
  }
}
