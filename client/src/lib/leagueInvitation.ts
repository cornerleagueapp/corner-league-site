import { apiRequest } from "./apiClient";
import { unwrapSportData } from "./sportRegistration";
export type LeagueInvite = { organizationName: string; seasonName: string; teamName: string; recipientName?: string; role: string; sport: string; status: string; inviterName: string; emailHint: string };
export async function readLeagueInvitation(season: string, token: string): Promise<LeagueInvite> {
  const value = unwrapSportData<LeagueInvite>(await apiRequest("POST", `/team-invitations/${season}/preview`, { token }));
  if (!value || typeof value.organizationName !== "string" || typeof value.status !== "string" || typeof value.role !== "string") throw new Error("The invitation response is unavailable. Try again.");
  return value;
}
export async function readInvitationAccount(season: string, token: string) {
  const value = unwrapSportData<{matchesEmail: boolean; verified: boolean}>(await apiRequest("POST", `/team-invitations/${season}/account`, { token }, { refreshOn401: true }));
  if (!value || typeof value.matchesEmail !== "boolean" || typeof value.verified !== "boolean") throw new Error("Could not verify your invitation account.");
  return value;
}
