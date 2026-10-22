import { apiFetch, apiRequest } from "./apiClient";
import { galleryResponse, type GalleryPhoto } from "./organizationGallery";
export type EventPhoto = GalleryPhoto & {
  published: boolean;
  revision: number;
  canRemove?: boolean;
};
export function responseData(value: any) {
  return value?.status === true ? value.data : value;
}
export async function loadEventGallery(
  eventId: string,
  page: number,
  mine = false,
) {
  const raw = responseData(
    await apiRequest(
      "GET",
      `/organization-gallery/events/${encodeURIComponent(eventId)}${mine ? "/me" : ""}?page=${page}&limit=12`,
    ),
  );
  const data = galleryResponse(raw);
  return {
    ...data,
    items: data.items as EventPhoto[],
    canModerate: raw.canModerate === true,
  };
}
export async function writeEventPhoto(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: FormData | object,
) {
  const response = await apiFetch(`/organization-gallery/events/${path}`, {
    method,
    body,
  });
  if (!response.ok) {
    const value = await response.json().catch(() => null);
    const message = value?.message;
    throw new Error(
      response.status === 409
        ? "This photo changed. Refresh and try again."
        : typeof message === "string"
          ? message
          : "Unable to save this photo. Please try again.",
    );
  }
  return responseData(await response.json());
}
