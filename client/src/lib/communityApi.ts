import { apiRequest } from "@/lib/apiClient";
import { racerResponseData } from "@/lib/selfRacerLookup";

export type PublicAthlete = {
  athleteId: string;
  name: string;
  imageUrl: string | null;
  profileUrl: string | null;
  sportKey: string | null;
  isVerifiedAthlete: boolean;
};
export type PublicCommunityProfile = {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
    bio: string | null;
    tags: { profile: string[] };
    sportInterests: string[];
    createdAt: string;
  };
  racerProfile: PublicAthlete | null;
};
export type AthleteFollowState = {
  athleteId: string;
  isFollowing: boolean;
  followerCount: number;
  isOwnAthlete: boolean;
};
export type FollowedAthletes = {
  items: (PublicAthlete & { location: string | null })[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
};

function validAthlete(value: any): boolean {
  return (
    !!value &&
    typeof value.athleteId === "string" &&
    typeof value.name === "string" &&
    typeof value.isVerifiedAthlete === "boolean" &&
    (value.profileUrl === null ||
      (typeof value.profileUrl === "string" &&
        /^\/racer\/[^/?#]+$/.test(value.profileUrl)))
  );
}
export async function getCommunityProfile(
  username: string,
): Promise<PublicCommunityProfile> {
  const data = racerResponseData(
    await apiRequest<unknown>(
      "GET",
      `/community/profiles/${encodeURIComponent(username)}`,
    ),
  );
  if (
    !data.user ||
    typeof data.user.id !== "string" ||
    typeof data.user.username !== "string" ||
    !Array.isArray(data.user.tags?.profile) ||
    !Array.isArray(data.user.sportInterests) ||
    !(data.racerProfile === null || validAthlete(data.racerProfile))
  )
    throw new Error("Unable to read this profile. Please try again.");
  return data;
}
function parseFollowState(payload: unknown): AthleteFollowState {
  const data = racerResponseData(payload);
  if (
    typeof data.athleteId !== "string" ||
    typeof data.isFollowing !== "boolean" ||
    typeof data.isOwnAthlete !== "boolean" ||
    !Number.isInteger(data.followerCount) ||
    data.followerCount < 0
  )
    throw new Error("Unable to check athlete following. Please try again.");
  return data;
}
export async function getAthleteFollowState(
  athleteId: string,
): Promise<AthleteFollowState> {
  return parseFollowState(
    await apiRequest<unknown>(
      "GET",
      `/community/me/athlete-follows/${encodeURIComponent(athleteId)}`,
      undefined,
      { refreshOn401: true, logoutOn401: true },
    ),
  );
}
export async function setAthleteFollow(
  athleteId: string,
  following: boolean,
): Promise<AthleteFollowState> {
  return parseFollowState(
    await apiRequest<unknown>(
      following ? "PUT" : "DELETE",
      `/community/me/athlete-follows/${encodeURIComponent(athleteId)}`,
      undefined,
      { refreshOn401: true, logoutOn401: true },
    ),
  );
}
export async function getAthleteFollowSummary(
  athleteId: string,
): Promise<{ athleteId: string; followerCount: number }> {
  const data = racerResponseData(
    await apiRequest<unknown>(
      "GET",
      `/community/athletes/${encodeURIComponent(athleteId)}/follow-summary`,
    ),
  );
  if (
    data.athleteId !== athleteId ||
    !Number.isInteger(data.followerCount) ||
    data.followerCount < 0
  )
    throw new Error("Unable to load athlete followers.");
  return data;
}
export async function getProfileAthletes(
  username: string,
  page: number,
): Promise<FollowedAthletes> {
  const data = racerResponseData(
    await apiRequest<unknown>(
      "GET",
      `/community/profiles/${encodeURIComponent(username)}/athletes?page=${page}&limit=12`,
    ),
  );
  if (
    !Array.isArray(data.items) ||
    !data.items.every(validAthlete) ||
    !Number.isInteger(data.total) ||
    data.total < 0 ||
    typeof data.hasNextPage !== "boolean"
  )
    throw new Error("Unable to load followed athletes. Please try again.");
  return data;
}
