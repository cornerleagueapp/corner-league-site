import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ClubsCache, ChatCache } from "@/lib/cache";
import cornerLeagueLogo from "@assets/CL Logo Mark-02_1754280623650.png";

type ClubsPayload = {
  data?: {
    clubs?: any[];
    data?: { clubs?: any[] };
  };
  clubs?: any[];
};

function pullClubs(json: ClubsPayload): any[] {
  return json?.data?.clubs ?? json?.data?.data?.clubs ?? json?.clubs ?? [];
}

export default function Clubs() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const [activeView, setActiveView] = useState<"discover" | "my">("discover");
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

  const userClubs = (clubsData as any)?.userClubs ?? [];
  const allPublic = (clubsData as any)?.publicClubs ?? [];

  // Discover = public clubs the user is NOT already in
  const discoverClubs = allPublic.filter(
    (c: any) => !userClubs.some((m: any) => m?.id === c?.id)
  );

  const gridClubs = activeView === "discover" ? discoverClubs : userClubs;

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

  const handleDeleteConfirm = () => {
    deleteClubMutation.mutate(deleteConfirmation.clubId);
  };

  const showDeleteConfirmation = (clubId: string, clubName: string) => {
    setDeleteConfirmation({ show: true, clubId, clubName });
  };

  const openClub = (club: any) => {
    console.log("[Clubs] openClub ->", club);

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

  return (
    <div className="min-h-screen bg-black text-white flex relative">
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
          {/* Browse tabs  */}
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

          {/* User's Clubs list */}
          <div className="mb-6">
            {/* <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
              My clubs
            </h3> */}
            <div className="space-y-2">
              {userClubs.map((club: any) => (
                <div key={club.id} className="relative group">
                  <div className="flex items-center gap-1">
                    <Link href={`/clubs/${club.id}`} className="flex-1">
                      <button
                        onClick={() => openClub(club)}
                        className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors flex items-center gap-2"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            club.isActive ? "bg-green-500" : "bg-gray-500"
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span>{club.name}</span>
                              {!!club.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {club.description}
                                </p>
                              )}
                            </div>
                            {club.isPrivate && (
                              <span className="text-xs bg-orange-600 px-2 py-1 rounded-full ml-2">
                                Private
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </Link>
                    {/* <button
                      onClick={() => showDeleteConfirmation(club.id, club.name)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete club"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button> */}
                  </div>
                </div>
              ))}
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
        <div className="p-6 pt-16 md:pt-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Clubs</h1>
            <p className="text-gray-400 mt-1">
              {activeView === "discover"
                ? "Discover and join live clubs"
                : "Your clubs"}
            </p>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openClub(club);
                    }}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-gray-700 bg-[#161616] hover:border-gray-500 transition"
                    aria-label={`Open ${club.name}`}
                  >
                    <div className="h-40 w-full bg-gray-800">
                      {img ? (
                        <img
                          src={img}
                          alt={club.name}
                          className="h-full w-full object-cover"
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
                  {activeView === "discover"
                    ? "No Public Clubs"
                    : "No Clubs Yet"}
                </h3>
                <p className="text-gray-500">
                  {activeView === "discover"
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
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-600 bg-opacity-20 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Delete Club
                </h3>
                <p className="text-gray-400 text-sm">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                "{deleteConfirmation.clubName}"
              </span>
              ? This will permanently remove the club and all its data including
              chat history.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setDeleteConfirmation({
                    show: false,
                    clubId: "",
                    clubName: "",
                  })
                }
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                disabled={deleteClubMutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteClubMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {deleteClubMutation.isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Club"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
