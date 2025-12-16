// src/lib/geminiRacerAnalysis.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

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

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

if (!apiKey) {
  console.warn(
    "[geminiRacerAnalysis] VITE_GEMINI_API_KEY is not set. AI analysis will not work."
  );
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const MODEL_NAME = "gemini-2.5-flash";

export async function generateRacerAnalysis(
  racer: RacerForAnalysis
): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini is not configured (missing API key).");
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const dataForAI = {
    id: racer.id,
    name: racer.racerName,
    age: racer.racerAge,
    location: racer.location,
    boatManufacturers: racer.boatManufacturers,
    careerWins: racer.careerWins ?? 0,
    seasonWins: racer.seasonWins ?? 0,
    seasonPodiums: racer.seasonPodiums ?? 0,
    careerWorldFinalsWins: racer.careerWorldFinalsWins ?? 0,
    heightMeters: racer.height ?? null,
    weightKg: racer.weight ?? null,
    bio: racer.bio ?? null,
  };

  const prompt = `
    You are a professional jet ski race analyst for the Corner League / Olympic AI platform.

    You are given structured data about ONE racer. Using ONLY this data, write a short fan-facing analysis of the racer.
    - Call out career wins, season wins, season podiums, and world finals wins if they are non-zero.
    - Mention age, origin/location, and boat manufacturer if present.
    - Infer whether they feel like a veteran, rising star, or newcomer from the stats and age.
    - Keep it hype but professional, 2–3 paragraphs max.
    - Do NOT invent specific numbers. If a field is missing or zero, simply don't mention it.

    RACER DATA (JSON):
    ${JSON.stringify(dataForAI, null, 2)}
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text() ?? "";
  return text.trim();
}
