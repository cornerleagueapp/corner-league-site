import { apiFetch } from "./apiClient";
export type ContactInput = {
  name: string;
  email: string;
  title: string;
  message: string;
  category: string;
  website: string;
};
export function contactRequestId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.floor(Math.random() * 16);
      return (c === "x" ? r : (r & 3) | 8).toString(16);
    })
  );
}
export async function sendContact(input: ContactInput, submissionId: string) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await apiFetch("/support-tickets/contact", {
      method: "POST",
      body: { ...input, submissionId },
      skipAuth: true,
      noRefresh: true,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok)
      throw new Error(
        res.status === 429
          ? "Too many requests. Please wait before trying again."
          : typeof json?.message === "string"
            ? json.message
            : "Your request could not be sent. Please try again.",
      );
    const d = json?.status === true ? json.data : json;
    if (typeof d?.ticketId !== "string")
      throw new Error(
        "We could not confirm receipt. Retry this request to check its status.",
      );
    return d as { ticketId: string };
  } catch (e) {
    if ((e as Error).name === "AbortError")
      throw new Error(
        "The request timed out. Retry with the same details to confirm receipt without creating another ticket.",
      );
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
