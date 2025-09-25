// src/pages/clubs.tsx
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ClubsCache, ChatCache } from "@/lib/cache";
import { PageSEO } from "@/seo/usePageSEO";
import cornerLeagueLogo from "@assets/CL_Logo.png";

type ClubsPayload = {
  data?: { clubs?: any[]; data?: { clubs?: any[] } };
  clubs?: any[];
};

function pullClubs(json: ClubsPayload): any[] {
  return json?.data?.clubs ?? json?.data?.data?.clubs ?? json?.clubs ?? [];
}

export default function Clubs() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const [activeView, setActiveView] = useState<"discover" | "my">("my");
  const [search, setSearch] = useState("");
  const [visibleDiscover, setVisibleDiscover] = useState(20);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    clubId: string;
    clubName: string;
  }>({ show: false, clubId: "", clubName: "" });

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    ClubsCache.clearClubs();
  }, []);

  useEffect(() => {
    setVisibleDiscover(20);
  }, [activeView, search]);

  // Fetch clubs
  const { data: clubsData, isLoading } = useQuery({
    queryKey: ["clubs-and-myclubs", user?.id],
    enabled: isAuthenticated,
    retry: false,
    queryFn: async () => {
      const [allRes, mineRes] = await Promise.all([
        apiRequest<ClubsPayload>("GET", "/clubs"),
        user?.id
          ? apiRequest<ClubsPayload>("GET", `/users/${user.id}/get-clubs`)
          : Promise.resolve({ data: { clubs: [] } } as ClubsPayload),
      ]);

      const publicClubs = pullClubs(allRes);
      const userClubs = pullClubs(mineRes);
      return { publicClubs, userClubs };
    },
  });

  const userClubsRaw = (clubsData as any)?.userClubs ?? [];
  const allPublicRaw = (clubsData as any)?.publicClubs ?? [];

  // Discover = public clubs the user is NOT already in
  const discoverClubsRaw = useMemo(
    () =>
      allPublicRaw.filter(
        (c: any) => !userClubsRaw.some((m: any) => m?.id === c?.id)
      ),
    [allPublicRaw, userClubsRaw]
  );

  // ---------- SORT (alphabetical by name) ----------
  const sortByName = (arr: any[]) =>
    [...arr].sort((a, b) =>
      (a?.name || "").localeCompare(b?.name || "", undefined, {
        sensitivity: "base",
      })
    );

  const myClubsSorted = useMemo(() => sortByName(userClubsRaw), [userClubsRaw]);
  const discoverSorted = useMemo(
    () => sortByName(discoverClubsRaw),
    [discoverClubsRaw]
  );

  // ---------- FILTER (search across name/desc/owner) ----------
  const s = search.trim().toLowerCase();
  const matches = (club: any) => {
    if (!s) return true;
    const haystack = [
      club?.name,
      club?.description,
      club?.ownerName,
      club?.owner?.firstName,
      club?.owner?.lastName,
      club?.ownerFirstName,
      club?.ownerLastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(s);
  };

  const myClubsFiltered = useMemo(
    () => myClubsSorted.filter(matches),
    [myClubsSorted, s]
  );
  const discoverFiltered = useMemo(
    () => discoverSorted.filter(matches),
    [discoverSorted, s]
  );

  // ---------- PAGINATE (Discover only) ----------
  const discoverVisible = useMemo(
    () => discoverFiltered.slice(0, visibleDiscover),
    [discoverFiltered, visibleDiscover]
  );

  // What to render in the grid
  const gridClubs =
    activeView === "discover" ? discoverVisible : myClubsFiltered;

  // Delete club mutation
  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      const response = await apiRequest("DELETE", `/api/clubs/${clubId}`);
      return await response.json();
    },
    onSuccess: async () => {
      ClubsCache.removeClub(deleteConfirmation.clubId);
      ChatCache.clearChatHistory(deleteConfirmation.clubId);
      queryClient.invalidateQueries({
        queryKey: ["clubs-and-myclubs", user?.id],
      });
      await queryClient.refetchQueries({
        queryKey: ["clubs-and-myclubs", user?.id],
      });

      toast({
        title: "Club deleted",
        description: `${deleteConfirmation.clubName} has been deleted successfully.`,
      });
      setDeleteConfirmation({ show: false, clubId: "", clubName: "" });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/api/login"), 500);
        return;
      }
      toast({
        title: "Delete failed",
        description:
          error.message || "Failed to delete club. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConfirm = () =>
    deleteClubMutation.mutate(deleteConfirmation.clubId);
  const showDeleteConfirmation = (clubId: string, clubName: string) =>
    setDeleteConfirmation({ show: true, clubId, clubName });

  const openClub = (club: any) => {
    setIsSidebarOpen(false);
    localStorage.setItem(
      "currentClub",
      JSON.stringify({
        id: club.id,
        clubName: club.name,
        description: club.description,
        maxMembers: club.maxMembers,
        isPrivate: club.isPrivate,
        streamingSource: club.streamingSource || "nfl",
        ownerId: club.ownerId,
      })
    );
    navigate(`/clubs/${club.id}`);
  };

  const canLoadMoreDiscover =
    activeView === "discover" &&
    discoverFiltered.length > discoverVisible.length;

  return (
    <div className="min-h-screen bg-black text-white flex relative">
      <PageSEO
        title="Clubs"
        description="Discover public clubs or manage your own on Corner League. Join live communities for your favorite teams."
        canonicalPath="/clubs"
        image="https://cornerleague.com/og/clubs.png"
      />

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors shadow-lg"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`w-64 border-r border-gray-700 flex flex-col z-40 md:relative md:translate-x-0 fixed transition-transform duration-300 ease-in-out bg-[#000000] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-center">
            <img
              src={cornerLeagueLogo}
              alt="Corner League"
              className="h-8 w-auto"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              Profile
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveView("my")}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeView === "my"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Account Settings
              </button>
              <button
                onClick={() => setActiveView("discover")}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeView === "discover"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Logout
              </button>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              Clubs
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveView("my")}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeView === "my"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                My Clubs
              </button>
              <button
                onClick={() => setActiveView("discover")}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                  activeView === "discover"
                    ? "bg-gray-800 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Discover Clubs
              </button>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="p-4 border-t border-gray-700">
          <Link href="/">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors text-left"
            >
              ← Back to Home
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="p-6 pt-16 md:pt-6 border-b border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Clubs</h1>
            <p className="text-gray-400 mt-1">
              {activeView === "discover" ? "Discover and join" : "Your clubs"}
            </p>
          </div>

          {/* Search field */}
          <div className="w-full md:w-96">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                  />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${
                  activeView === "discover" ? "discover" : "my"
                } clubs…`}
                className="w-full pl-9 pr-9 py-2 rounded-md bg-[#111111] border border-gray-700 text-sm text-gray-100 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
              {search && (
                <button
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-gray-400 hover:text-gray-200"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <Link href="/create-club">
            <button className="px-4 py-2 hover:bg-gray-300 font-medium rounded-md transition-colors text-[#000000] bg-[#f7f7f7]">
              Add Club
            </button>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-800 bg-[#161616] animate-pulse"
                >
                  <div className="h-40 w-full bg-gray-800/70" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-2/3 bg-gray-800/70 rounded" />
                    <div className="h-3 w-1/2 bg-gray-800/70 rounded" />
                    <div className="h-3 w-1/3 bg-gray-800/70 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : gridClubs.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {gridClubs.map((club: any) => {
                  const img =
                    club.image || club.imageUrl || club.coverImage || null;
                  const owner =
                    club.owner?.firstName || club.ownerFirstName
                      ? `${club.owner?.firstName ?? club.ownerFirstName} ${
                          club.owner?.lastName ?? club.ownerLastName ?? ""
                        }`.trim()
                      : club.ownerName || "Unknown Owner";
                  const members = club.memberCount ?? club.member_count ?? 0;
                  const max = club.maxMembers ?? club.max_members ?? "—";
                  const isActive = !!club.isActive;

                  return (
                    <div
                      key={club.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openClub(club)}
                      onKeyDown={(e) =>
                        (e.key === "Enter" || e.key === " ") && openClub(club)
                      }
                      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-700 bg-[#161616] hover:border-gray-500 transition"
                      aria-label={`Open ${club.name}`}
                    >
                      <div className="h-40 w-full bg-gray-800">
                        {img ? (
                          <img
                            src={img}
                            alt={club.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-500 text-sm">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-white font-medium truncate pr-2">
                            {club.name}
                          </h3>
                          <span
                            className={`ml-2 inline-block h-2 w-2 rounded-full ${
                              isActive ? "bg-green-500" : "bg-gray-500"
                            }`}
                          />
                        </div>
                        <div className="mt-1 text-sm text-gray-400 truncate">
                          {owner}
                        </div>
                        <div className="mt-3 flex justify-between text-xs text-gray-400">
                          <span>Members</span>
                          <span className="text-blue-400">
                            {members}/{max}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load more for Discover */}
              {canLoadMoreDiscover && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setVisibleDiscover((n) => n + 20)}
                    className="px-4 py-2 rounded-md border border-gray-700 bg-[#121212] hover:bg-[#1a1a1a] text-gray-100"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-900 rounded-lg border border-gray-700 h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-500 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-300 mb-2">
                  {search
                    ? "No clubs match your search"
                    : activeView === "discover"
                    ? "No Public Clubs"
                    : "No Clubs Yet"}
                </h3>
                <p className="text-gray-500">
                  {search
                    ? "Try a different name or keyword."
                    : activeView === "discover"
                    ? "Create your first public club or wait for others to go live"
                    : "Join or create a club to get started"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* ...modal content unchanged... */}
        </div>
      )}
    </div>
  );
}
