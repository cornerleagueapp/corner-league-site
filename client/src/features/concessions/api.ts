import { apiFetch } from "@/lib/apiClient";
export async function concessionsRequest<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await apiFetch(`/concessions/${path}`, {
    method: body === undefined ? "GET" : "POST",
    body,
    signal,
    cache: "no-store",
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(
      typeof payload?.message === "string"
        ? payload.message
        : `Unable to load concessions (${res.status}).`,
    );
  return payload?.status === true && "data" in payload ? payload.data : payload;
}
