const VOTER_KEY_STORAGE_KEY = "cornerLeagueAnonymousVoterKey";

export function getAnonymousVoterKey(): string {
  const existing = window.localStorage.getItem(VOTER_KEY_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const newKey =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(VOTER_KEY_STORAGE_KEY, newKey);

  return newKey;
}
