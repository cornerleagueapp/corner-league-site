import { apiFetch } from "@/lib/apiClient";

export type ArcadeCourseMap = {
  laps: number;
  width: number;
  height: number;
  start: {
    x: number;
    y: number;
  };
  checkpoints: Array<{
    id: number;
    x: number;
    y: number;
    side: "left" | "right";
  }>;
};

export type ArcadeCourse = {
  id: string;
  name: string;
  slug: string;
  mapJson: ArcadeCourseMap;
  isActive: boolean;
  isWeeklyChallenge: boolean;
  sponsorName?: string | null;
  sponsorLogoUrl?: string | null;
};

export type ArcadeCpuRacer = {
  id: string;
  athleteId?: string | null;
  displayName: string;
  skinKey: string;
  speedRating: number;
  accelerationRating: number;
  turnRating: number;
  aggressionRating: number;
  consistencyRating: number;
  mistakeChance: number;
};

export type ArcadeRun = {
  id: string;
  courseId: string;
  userId?: string | null;
  athleteId?: string | null;
  displayName: string;
  timeMs: number;
  penalties: number;
  lapsCompleted: number;
  completed: boolean;
  runStats?: Record<string, any> | null;
  createdAt: string;
};

export type CreateArcadeRunInput = {
  courseId: string;
  userId?: string;
  athleteId?: string;
  displayName: string;
  timeMs: number;
  penalties: number;
  lapsCompleted: number;
  completed: boolean;
  runStats?: Record<string, any>;
  clientRunHash?: string;
};

async function readJsonOrThrow<T>(
  res: Response,
  fallbackMessage: string,
): Promise<T> {
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json?.message || fallbackMessage);
  }

  return (json?.data ?? json) as T;
}

export async function getActiveArcadeCourse() {
  const res = await apiFetch("/arcade/course/active", {
    method: "GET",
    noRefresh: true,
  });

  return readJsonOrThrow<ArcadeCourse>(
    res,
    "Failed to load active arcade course",
  );
}

export async function getArcadeCpuRacers(limit = 4) {
  const res = await apiFetch(`/arcade/cpu-racers?limit=${limit}`, {
    method: "GET",
    noRefresh: true,
  });

  return readJsonOrThrow<ArcadeCpuRacer[]>(res, "Failed to load CPU racers");
}

export async function saveArcadeRun(input: CreateArcadeRunInput) {
  const res = await apiFetch("/arcade/runs", {
    method: "POST",
    noRefresh: true,
    body: JSON.stringify(input),
  });

  return readJsonOrThrow<ArcadeRun>(res, "Failed to save arcade run");
}

export async function getArcadeLeaderboard(courseId: string, limit = 25) {
  const res = await apiFetch(`/arcade/leaderboard/${courseId}?limit=${limit}`, {
    method: "GET",
    noRefresh: true,
  });

  return readJsonOrThrow<ArcadeRun[]>(res, "Failed to load arcade leaderboard");
}
