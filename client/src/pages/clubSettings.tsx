// src/pages/clubSettings.tsx
import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { PageSEO } from "@/seo/usePageSEO";

type ClubOwner = { id: string };
type ClubDetails = {
  id: string;
  clubName: string;
  owner?: ClubOwner;
  coOwners?: ClubOwner[];
};

export default function ClubSettings() {
  const [, params] = useRoute("/club-settings/:id");
  const clubId = params?.id!;
  const { user } = useAuth();

  // Fetch details (owner / co-owners)
  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ["club-settings-details", clubId, user?.id],
    queryFn: async () => {
      const json = await apiRequest<any>(
        "GET",
        `/clubs/${clubId}/details?user_id=${user?.id ?? ""}`
      );
      return json?.data as ClubDetails;
    },
    enabled: !!clubId,
  });

  // Fetch membership (true/false)
  const { data: isMember } = useQuery({
    queryKey: ["club-settings-is-member", clubId, user?.id],
    queryFn: async () => {
      const json = await apiRequest<any>(
        "GET",
        `/clubs/${clubId}/is-member?userId=${user?.id ?? ""}`
      );
      return !!json?.data?.isMember;
    },
    enabled: !!clubId && !!user?.id,
  });

  // Role logic
  const isOwner =
    !!user?.id &&
    !!details?.owner?.id &&
    (details.owner.id === user.id ||
      (details?.coOwners ?? []).some((co) => co.id === user.id));

  let statusText = "You are not a member of the club";
  if (isOwner) statusText = "You are owner of the club";
  else if (isMember) statusText = "You are a member of the club";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <PageSEO
        title="Club Settings"
        description="Manage club settings on Corner League."
        canonicalPath={`/club-settings/${clubId}`}
      />

      <div className="w-full max-w-md">
        {/* Header (mirrors create-club.tsx style) */}
        <div className="relative text-center mb-8">
          <Link
            href={`/clubs/${clubId}`}
            className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors"
            aria-label="Close settings"
            title="Back"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Club Settings</h1>
          <p className="text-gray-400">
            {loadingDetails ? "Loading club…" : details?.clubName || "Club"}
          </p>
        </div>

        {/* Status card */}
        <div className="bg-gray-800 border border-gray-600 rounded-md p-4 mb-6">
          <div className="text-lg">
            <span
              className={
                isOwner
                  ? "text-green-400"
                  : isMember
                  ? "text-blue-300"
                  : "text-orange-300"
              }
            >
              {statusText}
            </span>
          </div>
          {!user?.id && (
            <p className="text-sm text-gray-400 mt-2">
              You’re not signed in.{" "}
              <Link href="/auth" className="underline hover:text-white">
                Sign in
              </Link>{" "}
              to manage membership.
            </p>
          )}
        </div>

        {/* Future settings form area (intentionally empty for now) */}
        <div className="bg-gray-800 border border-gray-600 rounded-md p-6">
          <p className="text-gray-400">
            Settings coming soon. (We’ll add controls here—privacy, image,
            co-owners, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}
