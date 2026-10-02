// src/lib/geminiRacerAnalysis.ts
import { apiRequest } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/token";
import { racerResponseData } from "@/lib/selfRacerLookup";

export type RacerForAnalysis = {
  id: string | number;
  racerName: string;
  racerAge?: number;
  bio?: string | null;
  racerImage?: string | null;
  location?: string | null;
  boatManufacturers?: string | null;
  careerWins?: number;
  seasonWins?: number;
  seasonPodiums?: number;
  careerWorldFinalsWins?: number;
  height?: number | null;
  weight?: number | null;
};

export async function generateRacerAnalysis(
  racer: RacerForAnalysis,
): Promise<string> {
  if (!getAccessToken()) throw new Error("Sign in to view racer analysis.");
  const data = racerResponseData(
    await apiRequest<unknown>(
      "GET",
      `/community/me/racers/${encodeURIComponent(String(racer.id))}/analysis`,
      undefined,
      { refreshOn401: true, logoutOn401: true },
    ),
  );
  if (typeof data.text !== "string" || !data.text.trim())
    throw new Error("Racer analysis is temporarily unavailable.");
  return data.text.trim();
}
