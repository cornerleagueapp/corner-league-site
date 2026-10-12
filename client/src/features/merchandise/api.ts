import { apiFetch } from "@/lib/apiClient";
export class MerchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
export async function merchRequest<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const res = await apiFetch(`/merchandise/${path}`, {
    method: body === undefined ? "GET" : "POST",
    body,
    signal,
    noRefresh: false,
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok)
    throw new MerchError(
      typeof payload?.message === "string"
        ? payload.message
        : `Store request failed (${res.status}).`,
      res.status,
    );
  return payload?.status === true && "data" in payload ? payload.data : payload;
}
