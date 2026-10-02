export const ORGANIZATION_SIGNUP_URL =
  "https://admin.cornerleague.com/create-organization";
export function consumerAuthDestination(
  search: string,
  wantsOrganization: boolean,
) {
  const params = new URLSearchParams(search);
  if (wantsOrganization || params.get("intent") === "organization")
    return `${ORGANIZATION_SIGNUP_URL}?mode=login`;
  const next = params.get("next") || "/scores/aqua";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/scores/aqua";
}

export async function signupThenSignIn<T>(
  signup: () => Promise<unknown>,
  signIn: () => Promise<T>,
): Promise<T> {
  await signup();
  try {
    return await signIn();
  } catch {
    throw Object.assign(
      new Error("Your account was created. Sign in to continue."),
      { accountCreated: true },
    );
  }
}
