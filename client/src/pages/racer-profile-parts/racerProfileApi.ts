import { apiRequest } from "@/lib/apiClient";
import type { RacerGalleryItem, RacerSponsor } from "./types";

export async function uploadAthleteImage(
  athleteId: string,
  userId: string,
  file: File,
): Promise<string> {
  const form = new FormData();
  form.append("userId", userId);
  form.append("media", file);

  const res = await apiRequest<any>(
    "PATCH",
    `/athletes/${encodeURIComponent(athleteId)}/profile-image`,
    form as any,
  );

  const url = res?.mediaUrl ?? res?.data?.mediaUrl ?? res?.url ?? null;

  if (!url) {
    throw new Error("Upload succeeded but no mediaUrl returned");
  }

  return String(url);
}

export async function uploadAthleteHeaderImage(
  athleteId: string,
  userId: string,
  file: File,
): Promise<string> {
  const form = new FormData();
  form.append("userId", userId);
  form.append("media", file);

  const res = await apiRequest<any>(
    "PATCH",
    `/athletes/${encodeURIComponent(athleteId)}/header-image`,
    form as any,
  );

  const url = res?.mediaUrl ?? res?.data?.mediaUrl ?? res?.url ?? null;

  if (!url) {
    throw new Error("Upload succeeded but no mediaUrl returned");
  }

  return String(url);
}

export async function updateAthleteSocialLinks(
  athleteId: string,
  userId: string,
  values: {
    instagramUrl?: string;
    youtubeUrl?: string;
    tiktokUrl?: string;
    facebookUrl?: string;
    websiteUrl?: string;
  },
): Promise<any> {
  return apiRequest<any>(
    "PATCH",
    `/athletes/${encodeURIComponent(athleteId)}/social-links`,
    {
      userId,
      instagramUrl: values.instagramUrl || undefined,
      youtubeUrl: values.youtubeUrl || undefined,
      tiktokUrl: values.tiktokUrl || undefined,
      facebookUrl: values.facebookUrl || undefined,
      websiteUrl: values.websiteUrl || undefined,
    },
  );
}

export async function createAthleteSponsor(
  athleteId: string,
  userId: string,
  values: {
    name: string;
    websiteUrl?: string;
    logoFile?: File | null;
  },
): Promise<RacerSponsor> {
  const form = new FormData();
  form.append("userId", userId);
  form.append("name", values.name);
  form.append("websiteUrl", values.websiteUrl ?? "");

  if (values.logoFile) {
    form.append("logo", values.logoFile);
  }

  const res = await apiRequest<any>(
    "POST",
    `/athletes/${encodeURIComponent(athleteId)}/sponsors`,
    form as any,
  );

  const sponsor = res?.sponsor ?? res?.data?.sponsor ?? res?.data ?? res;

  if (!sponsor || typeof sponsor !== "object") {
    throw new Error("Sponsor created but no sponsor object returned");
  }

  return sponsor as RacerSponsor;
}

export async function uploadAthleteGalleryMedia(
  athleteId: string,
  userId: string,
  file: File,
  values?: {
    title?: string;
    caption?: string;
    isFeatured?: boolean;
  },
): Promise<RacerGalleryItem> {
  const form = new FormData();
  form.append("userId", userId);
  form.append("media", file);
  form.append("title", values?.title ?? "");
  form.append("caption", values?.caption ?? "");
  form.append("isFeatured", values?.isFeatured ? "true" : "false");

  const res = await apiRequest<any>(
    "POST",
    `/athletes/${encodeURIComponent(athleteId)}/gallery`,
    form as any,
  );

  const media = res?.media ?? res?.data?.media ?? res?.data ?? res;

  if (!media || typeof media !== "object") {
    throw new Error("Gallery media uploaded but no media object returned");
  }

  return media as RacerGalleryItem;
}

export async function fetchAthleteGallery(
  athleteId: string,
): Promise<RacerGalleryItem[]> {
  const res = await apiRequest<any>(
    "GET",
    `/athletes/${encodeURIComponent(athleteId)}/gallery`,
  );

  const list =
    res?.gallery ??
    res?.media ??
    res?.data?.gallery ??
    res?.data?.media ??
    res?.data ??
    res;

  return Array.isArray(list) ? (list as RacerGalleryItem[]) : [];
}

export async function fetchAthleteSponsors(
  athleteId: string,
): Promise<RacerSponsor[]> {
  const res = await apiRequest<any>(
    "GET",
    `/athletes/${encodeURIComponent(athleteId)}/sponsors`,
  );

  const list = res?.sponsors ?? res?.data?.sponsors ?? res?.data ?? res;

  return Array.isArray(list) ? (list as RacerSponsor[]) : [];
}

export async function pollUploadProgress(
  fileName: string,
  onTick: (pct: number) => void,
): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < 60_000) {
    try {
      const data = await apiRequest<{ progress: number }>(
        "GET",
        `/athletes/upload-progress/${encodeURIComponent(fileName)}`,
      );

      const pct = Math.max(0, Math.min(100, Number(data?.progress ?? 0)));
      onTick(pct);

      if (pct >= 100) break;
    } catch {
      // upload progress is optional; don't block the save flow
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
  }
}
