import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ClubsCache } from "@/lib/cache";

export default function CreateClub() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    clubName: "",
    description: "",
    maxMembers: 10,
    isPrivate: false,
    streamingSource: "nfl" as "nfl" | "youtube",
    buyMeCoffeeUsername: "",
  });

  const createClubMutation = useMutation({
    mutationFn: async (clubData: any) => {
      const response = await apiRequest("POST", "/api/clubs", {
        name: clubData.clubName,
        description: clubData.description,
        maxMembers: clubData.maxMembers,
        isPrivate: clubData.isPrivate,
        streamingSource: clubData.streamingSource,
        buyMeCoffeeUsername: clubData.buyMeCoffeeUsername,
      });
      return await response.json();
    },
    onSuccess: (club) => {
      toast({
        title: "Club Created",
        description: `${club.name} has been created successfully!`,
      });

      // Store club data for extension page
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
          buyMeCoffeeUsername: club.buyMeCoffeeUsername || "",
        })
      );

      // Clear the clubs cache to force fresh data
      ClubsCache.clearClubs();

      // Invalidate and refetch clubs data
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      queryClient.refetchQueries({ queryKey: ["/api/clubs"] });

      // Redirect to extension page
      setLocation("/extension");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }

      toast({
        title: "Error",
        description: "Failed to create club. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClubMutation.mutate(formData);
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="relative text-center mb-8">
          <Link
            href="/clubs"
            className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors"
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
          <h1 className="text-3xl font-bold mb-2">Create Club</h1>
          <p className="text-gray-400">
            Set up your sports club for fans to join
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Club Name */}
          <div>
            <label
              htmlFor="clubName"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Club Name
            </label>
            <input
              type="text"
              id="clubName"
              value={formData.clubName}
              onChange={(e) => handleInputChange("clubName", e.target.value)}
              placeholder="Enter club name"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Club Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Tell others about your club..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Let members know what your club is about
            </p>
          </div>

          {/* Member Capacity */}
          <div>
            <label
              htmlFor="maxMembers"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Maximum Members
            </label>
            <div className="relative">
              <input
                type="number"
                id="maxMembers"
                min="1"
                max="30"
                value={formData.maxMembers}
                onChange={(e) =>
                  handleInputChange("maxMembers", parseInt(e.target.value) || 1)
                }
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-400 text-sm">1-30</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose how many people can join your club
            </p>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Club Privacy
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPrivate}
                  onChange={() => handleInputChange("isPrivate", false)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
                />
                <div className="ml-3">
                  <div className="text-white font-medium">Public Club</div>
                  <div className="text-sm text-gray-400">
                    Anyone can discover and join your club
                  </div>
                </div>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPrivate}
                  onChange={() => handleInputChange("isPrivate", true)}
                  className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
                />
                <div className="ml-3">
                  <div className="text-white font-medium">Private Club</div>
                  <div className="text-sm text-gray-400">
                    Only people with an invite can join
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Streaming Source */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Streaming Source
            </label>
            <select
              value={formData.streamingSource}
              onChange={(e) =>
                handleInputChange("streamingSource", e.target.value)
              }
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="nfl">NFL Network</option>
              <option value="youtube">Fubo TV</option>
            </select>
            <div className="text-sm text-gray-400 mt-2">
              {formData.streamingSource === "nfl" &&
                "Stream live NFL content and highlights"}
              {formData.streamingSource === "youtube" &&
                "Stream live TV and sports on Fubo TV"}
            </div>
          </div>

          {/* Buy Me a Coffee */}
          <div>
            <label
              htmlFor="buyMeCoffeeUsername"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Tip (Optional)
            </label>
            <input
              type="text"
              id="buyMeCoffeeUsername"
              value={formData.buyMeCoffeeUsername}
              onChange={(e) =>
                handleInputChange("buyMeCoffeeUsername", e.target.value)
              }
              placeholder="your-url"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Members can tip. Just go to{" "}
              <a
                href="https://buymeacoffee.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                buymeacoffee.com
              </a>
              , create an account, and input your url.
            </p>
          </div>

          {/* Form Summary */}
          <div className="bg-gray-800 border border-gray-600 rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Club Summary
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Name:</span>
                <span className="text-white">
                  {formData.clubName || "Not set"}
                </span>
              </div>
              {formData.description && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Description:</span>
                  <span className="text-white text-right max-w-xs truncate">
                    {formData.description}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Max Members:</span>
                <span className="text-white">{formData.maxMembers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Privacy:</span>
                <span
                  className={`${
                    formData.isPrivate ? "text-orange-400" : "text-green-400"
                  }`}
                >
                  {formData.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Streaming:</span>
                <span className="text-blue-400">
                  {formData.streamingSource === "nfl"
                    ? "NFL Network"
                    : "Fubo TV"}
                </span>
              </div>
              {formData.buyMeCoffeeUsername && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Tips:</span>
                  <span className="text-yellow-400">Enabled</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={
                !formData.clubName.trim() || createClubMutation.isPending
              }
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {createClubMutation.isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                "Create Club"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
