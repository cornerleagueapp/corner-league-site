import { apiFetch } from "@/lib/apiClient";
export type SportOrganization = {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  primarySportKey: string;
};
export type SportDirectory = {
  sport: { key: string; label: string };
  organizations: SportOrganization[];
  meta: { itemCount: number; hasNextPage: boolean };
};
export async function fetchSportOrganizations(
  key: string,
  page = 1,
  signal?: AbortSignal,
): Promise<SportDirectory> {
  const response = await apiFetch(
    `/sports/catalog/${encodeURIComponent(key)}/organizations?page=${page}&limit=50`,
    { skipAuth: true, noRefresh: true, signal },
  );
  if (!response.ok)
    throw new Error("Unable to load this sport's organizations.");
  const json = await response.json();
  const data = json.data ?? json;
  if (
    data.sport?.key !== key ||
    typeof data.sport?.label !== "string" ||
    !Number.isSafeInteger(data.meta?.itemCount) ||
    data.meta.itemCount < 0 ||
    typeof data.meta?.hasNextPage !== "boolean" ||
    !Array.isArray(data.organizations) ||
    data.organizations.some(
      (org: SportOrganization) =>
        org.primarySportKey !== key ||
        typeof org.id !== "string" ||
        typeof org.name !== "string",
    )
  )
    throw new Error("Invalid sport directory response.");
  return data;
}
export async function fetchAllSportOrganizations(
  key: string,
  signal?: AbortSignal,
): Promise<SportOrganization[]> {
  const rows: SportOrganization[] = [];
  for (let page = 1; page <= 200; page++) {
    const data = await fetchSportOrganizations(key, page, signal);
    rows.push(...data.organizations);
    if (!data.meta?.hasNextPage) return rows;
  }
  throw new Error("This directory is too large to load in one view.");
}
