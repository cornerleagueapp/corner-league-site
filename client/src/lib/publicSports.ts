export type PublicSport = {
  key: string;
  label: string;
  organizationCount: number;
  href: string;
  enabled: boolean;
};
export function publicSports(response: unknown): PublicSport[] {
  const value = response as any;
  const rows = value?.data?.sports ?? value?.sports;
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  return rows.flatMap((row) => {
    if (
      !row ||
      typeof row.key !== "string" ||
      !/^[a-z0-9-]+$/.test(row.key) ||
      typeof row.label !== "string" ||
      !row.label.trim() ||
      !Number.isSafeInteger(row.organizationCount) ||
      row.organizationCount < 1 ||
      seen.has(row.key)
    )
      return [];
    seen.add(row.key);
    return [
      {
        key: row.key,
        label: row.label,
        organizationCount: row.organizationCount,
        href: row.key === "jet-ski" ? "/scores/aqua" : `/sports/${row.key}`,
        enabled: true,
      },
    ];
  });
}
