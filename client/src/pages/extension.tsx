import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ChatCache, ClubsCache } from "@/lib/cache";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Extension() {
  const [zoomLevel, setZoomLevel] = useState(50);
  const [clubData, setClubData] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    clubName: "",
    description: "",
    maxMembers: 10,
    isPrivate: false,
    streamingSource: "nfl" as "nfl" | "youtube" | "sling",
    buyMeCoffeeUsername: "",
  });
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Get clubs data to check ownership
  const { data: clubsData } = useQuery({
    queryKey: ["/api/clubs"],
    enabled: !!user,
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    clubId: string;
    clubName: string;
  }>({
    show: false,
    clubId: "",
    clubName: "",
  });
  const [embedUrl, setEmbedUrl] = useState("");
  const [embedHtml, setEmbedHtml] = useState("");
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load club data from localStorage first (for immediate UI)
    const storedClub = localStorage.getItem("currentClub");
    if (storedClub) {
      const data = JSON.parse(storedClub);
      setClubData(data);
      setSettingsForm({
        clubName: data.clubName || "",
        description: data.description || "",
        maxMembers: data.maxMembers || 10,
        isPrivate: data.isPrivate || false,
        streamingSource:
          data.streamingSource === "espn"
            ? "youtube"
            : data.streamingSource || "nfl",
        buyMeCoffeeUsername: data.buyMeCoffeeUsername || "",
      });

      // Then fetch fresh data from server to ensure we have latest updates
      if (data.id && user) {
        fetch(`/api/clubs/${data.id}`)
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            throw new Error("Failed to fetch club data");
          })
          .then((freshData) => {
            const updatedClubData = {
              id: freshData.id,
              clubName: freshData.name,
              description: freshData.description,
              maxMembers: freshData.maxMembers,
              isPrivate: freshData.isPrivate,
              streamingSource: freshData.streamingSource,
              buyMeCoffeeUsername: freshData.buyMeCoffeeUsername,
              ownerId: freshData.ownerId,
              memberCount: freshData.memberCount,
            };

            // Update state and localStorage with fresh data
            setClubData(updatedClubData);
            setSettingsForm({
              clubName: updatedClubData.clubName || "",
              description: updatedClubData.description || "",
              maxMembers: updatedClubData.maxMembers || 10,
              isPrivate: updatedClubData.isPrivate || false,
              streamingSource:
                updatedClubData.streamingSource === "espn"
                  ? "youtube"
                  : updatedClubData.streamingSource || "nfl",
              buyMeCoffeeUsername: updatedClubData.buyMeCoffeeUsername || "",
            });
            localStorage.setItem(
              "currentClub",
              JSON.stringify(updatedClubData)
            );
          })
          .catch((error) => {
            console.error("Failed to fetch fresh club data:", error);
            // Continue with localStorage data if server fetch fails
          });
      }
    }
  }, [user]);

  // Load chat history when club changes (try cache first)
  useEffect(() => {
    if (clubData?.id) {
      // Try cache first
      const cachedMessages = ChatCache.getChatHistory(clubData.id);
      if (cachedMessages) {
        console.log("Loading chat history from cache");
        setMessages(cachedMessages);
        return;
      }

      // Fallback to API
      console.log("Loading chat history from API");
      fetch(`/api/clubs/${clubData.id}/messages`)
        .then((response) => response.json())
        .then((data) => {
          const formattedMessages = data.map((msg: any) => ({
            id: msg.id,
            user: msg.username,
            text: msg.message,
            timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setMessages(formattedMessages);
          // Cache the messages
          ChatCache.setChatHistory(clubData.id, formattedMessages);
        })
        .catch((error) => console.error("Failed to load chat history:", error));
    }
  }, [clubData?.id]);

  // Check mute status and load club members for owners
  useEffect(() => {
    if (clubData?.id && user) {
      // Check if current user is muted
      fetch(`/api/clubs/${clubData.id}/mute-status`)
        .then((response) => response.json())
        .then((data) => setIsMuted(data.isMuted))
        .catch((error) => console.error("Failed to check mute status:", error));

      // Load club members if user is the owner (using direct comparison to avoid function order issues)
      if (user.id === clubData.ownerId) {
        fetch(`/api/clubs/${clubData.id}/members`)
          .then((response) => response.json())
          .then((data) => setClubMembers(data))
          .catch((error) =>
            console.error("Failed to load club members:", error)
          );
      }
    }
  }, [clubData?.id, user]);

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (clubData?.id && user) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);

        // Join the club room
        ws.send(
          JSON.stringify({
            type: "join_club",
            clubId: clubData.id,
            userId: user.id,
            username: user.firstName || user.username || "Anonymous",
          })
        );
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "chat_message":
            const newMessage = {
              id: data.id,
              user: data.username,
              text: data.text,
              timestamp: data.timestamp,
            };
            setMessages((prev) => {
              const updated = [...prev, newMessage];
              // Update cache with new message
              if (clubData?.id) {
                ChatCache.setChatHistory(clubData.id, updated);
              }
              return updated;
            });
            break;

          case "user_joined":
            // Optionally show join notifications
            break;

          case "user_left":
            // Optionally show leave notifications
            break;

          case "club_deleted":
            // Club has been deleted, redirect to clubs page
            console.log("Club deleted:", data.message);
            // Clear current club from localStorage
            localStorage.removeItem("currentClub");
            // Clear cached data for this club
            if (clubData?.id) {
              ChatCache.clearChatHistory(clubData.id);
            }
            // Redirect to clubs page
            window.location.href = "/clubs";
            break;
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };

      return () => {
        ws.close();
      };
    }
  }, [clubData?.id, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if current user owns this club
  const isClubOwner = () => {
    if (!user || !clubData) return false;

    // Check if the stored club data has ownerId and compare with current user
    return clubData.ownerId === user.id;
  };

  // Update club mutation
  const updateClubMutation = useMutation({
    mutationFn: async (clubData: any) => {
      const response = await apiRequest("PUT", `/api/clubs/${clubData.id}`, {
        name: clubData.clubName,
        description: clubData.description,
        maxMembers: clubData.maxMembers,
        isPrivate: clubData.isPrivate,
        streamingSource: clubData.streamingSource,
        buyMeCoffeeUsername: clubData.buyMeCoffeeUsername,
      });
      return await response.json();
    },
    onSuccess: (updatedClub) => {
      // Update local state and cache
      const updatedClubData = {
        ...clubData,
        clubName: updatedClub.name,
        description: updatedClub.description,
        maxMembers: updatedClub.maxMembers,
        isPrivate: updatedClub.isPrivate,
        streamingSource: updatedClub.streamingSource,
        buyMeCoffeeUsername: updatedClub.buyMeCoffeeUsername,
      };

      setClubData(updatedClubData);
      localStorage.setItem("currentClub", JSON.stringify(updatedClubData));

      // Invalidate clubs cache to refresh the clubs list
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      ClubsCache.clearClubs();

      toast({
        title: "Club updated",
        description: "Club settings have been saved successfully.",
      });

      setShowSettings(false);
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
        title: "Update failed",
        description:
          error.message || "Failed to update club settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clubData?.id) {
      updateClubMutation.mutate({
        id: clubData.id,
        clubName: settingsForm.clubName,
        description: settingsForm.description,
        maxMembers: settingsForm.maxMembers,
        isPrivate: settingsForm.isPrivate,
        streamingSource: settingsForm.streamingSource,
        buyMeCoffeeUsername: settingsForm.buyMeCoffeeUsername,
      });
    }
  };

  // Delete club mutation
  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      const response = await apiRequest("DELETE", `/api/clubs/${clubId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      ClubsCache.removeClub(deleteConfirmation.clubId);
      ChatCache.clearChatHistory(deleteConfirmation.clubId);
      localStorage.removeItem("currentClub");
      toast({
        title: "Club deleted",
        description: `${deleteConfirmation.clubName} has been deleted successfully.`,
      });
      setDeleteConfirmation({ show: false, clubId: "", clubName: "" });
      setLocation("/clubs");
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

  const handleDeleteClub = () => {
    if (clubData?.id && clubData?.clubName) {
      setDeleteConfirmation({
        show: true,
        clubId: clubData.id,
        clubName: clubData.clubName,
      });
    }
  };

  const handleSettingsChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const zoomOptions = [
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "100%" },
    { value: 125, label: "125%" },
    { value: 150, label: "150%" },
    { value: 200, label: "200%" },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && wsRef.current && isConnected) {
      // Send message through WebSocket
      wsRef.current.send(
        JSON.stringify({
          type: "chat_message",
          text: newMessage.trim(),
        })
      );
      setNewMessage("");
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here if desired
    });
  };

  const shareUrl = `${window.location.origin}/clubs?join=${clubData?.id || ""}`;
  const shareText = `Join my ${
    clubData?.clubName || "sports"
  } club on Corner League! ${shareUrl}`;

  // Function to fetch oEmbed data
  const fetchOEmbed = async (url: string) => {
    setIsLoadingEmbed(true);
    try {
      // For YouTube videos, use YouTube's oEmbed API
      const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
        url
      )}&format=json`;
      const response = await fetch(oEmbedUrl);

      if (response.ok) {
        const data = await response.json();
        setEmbedHtml(data.html);
      } else {
        toast({
          title: "Embed Failed",
          description:
            "Unable to embed this URL. Please check if it's a valid YouTube video.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Embed Failed",
        description: "Failed to fetch embed data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingEmbed(false);
    }
  };

  const handleEmbedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (embedUrl.trim()) {
      fetchOEmbed(embedUrl.trim());
    }
  };

  const clearEmbed = () => {
    setEmbedHtml("");
    setEmbedUrl("");
  };

  // Handle member mute/unmute
  const handleMemberMute = async (memberId: string, shouldMute: boolean) => {
    try {
      const response = await apiRequest(
        "POST",
        `/api/clubs/${clubData.id}/members/${memberId}/mute`,
        {
          isMuted: shouldMute,
        }
      );

      if (response.ok) {
        // Update local state
        setClubMembers((prev) =>
          prev.map((member) =>
            member.userId === memberId
              ? { ...member, isMuted: shouldMute }
              : member
          )
        );

        toast({
          title: shouldMute ? "Member muted" : "Member unmuted",
          description: shouldMute
            ? "Member cannot post messages or embed content"
            : "Member can now post messages and embed content",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to update member status",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  // Handle member removal
  const handleMemberRemove = async (memberId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this member? They will be banned from rejoining the club."
      )
    ) {
      return;
    }

    try {
      const response = await apiRequest(
        "POST",
        `/api/clubs/${clubData.id}/members/${memberId}/remove`,
        {}
      );

      if (response.ok) {
        // Remove member from local state
        setClubMembers((prev) =>
          prev.filter((member) => member.userId !== memberId)
        );

        toast({
          title: "Member removed",
          description: "Member has been removed and banned from the club",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to remove member",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header with Settings */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Tip Button - Only show if buyMeCoffeeUsername is set */}
            {clubData?.buyMeCoffeeUsername && (
              <button
                onClick={() =>
                  window.open(
                    `https://buymeacoffee.com/${clubData.buyMeCoffeeUsername}`,
                    "_blank"
                  )
                }
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium flex-shrink-0"
                title="Support the club owner"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-.766-1.605a4.73 4.73 0 0 0-1.209-1.18C17.055 2.678 15.925 2.5 15.17 2.5H8.83c-.755 0-1.885.178-2.939.464a4.73 4.73 0 0 0-1.209 1.18c-.378.442-.647 1.007-.766 1.605L3.784 6.415a9.757 9.757 0 0 0-.24 2.143v.793c0 2.48.952 4.628 2.659 6.05 1.671 1.392 3.816 1.849 5.797 1.849s4.126-.457 5.797-1.849c1.707-1.422 2.659-3.57 2.659-6.05v-.793a9.757 9.757 0 0 0-.24-2.143zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
                </svg>
                Tip
              </button>
            )}
            <h1 className="font-bold min-w-0 text-2xl sm:text-3xl md:text-4xl lg:text-5xl break-words leading-tight">
              {clubData?.clubName || "Clubs"}
            </h1>
          </div>
          {clubData && (
            <div className="ml-4 flex items-center gap-2">
              {/* Share Button - Always visible */}
              <button
                onClick={handleShare}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                title="Share Club"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>

              {/* Settings Button - Only for club owners */}
              {user && clubData && user.id === clubData.ownerId && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  title="Club Settings"
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Club Description */}
        {clubData?.description && (
          <div className="text-center mb-8">
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {clubData.description}
            </p>
          </div>
        )}

        {/* Zoom Control */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <label
              htmlFor="zoom-select"
              className="text-sm font-medium text-gray-300"
            >
              Zoom:
            </label>
            <select
              id="zoom-select"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {zoomOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Container Div for iframe */}
        <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
          <div
            className="origin-top-left transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              width: `${10000 / zoomLevel}%`,
              height: `${10000 / zoomLevel}%`,
            }}
          >
            <iframe
              className="w-full h-full rounded-lg"
              src={
                clubData?.streamingSource === "youtube"
                  ? "https://www.fubo.tv/welcome"
                  : "https://www.nfl.com/network/watch/nfl-network-live"
              }
              title={
                clubData?.streamingSource === "youtube"
                  ? "Fubo TV"
                  : "NFL Network Live"
              }
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Live Chat Section - Air Chat Style */}
        <div className="mt-8 w-full">
          <div className="px-4 py-3 mb-4">
            <h3 className="text-lg font-semibold text-white opacity-90">
              Live Chat
            </h3>
          </div>

          {/* Messages Area - Floating Style */}
          <div className="h-64 overflow-y-auto px-4 space-y-4">
            {messages.map((message) => {
              const isCurrentUser =
                user && message.user === (user.firstName || user.username);
              return (
                <div key={message.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isCurrentUser ? "text-blue-400" : "text-green-400"
                      }`}
                    >
                      {isCurrentUser ? "You" : message.user}
                    </span>
                    <span className="text-xs text-gray-500 opacity-70">
                      {message.timestamp}
                    </span>
                  </div>
                  <div
                    className={`max-w-fit ${isCurrentUser ? "ml-auto" : ""}`}
                  >
                    <p
                      className={`text-sm px-4 py-2 rounded-full backdrop-blur-sm ${
                        isCurrentUser
                          ? "bg-blue-500 bg-opacity-20 text-blue-100 border border-blue-400 border-opacity-30"
                          : "bg-white bg-opacity-10 text-gray-100 border border-white border-opacity-20"
                      }`}
                    >
                      {message.text}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input - Floating Style */}
          <form onSubmit={handleSendMessage} className="px-4 mt-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  isMuted
                    ? "You are muted and cannot send messages"
                    : "Type your message..."
                }
                className={`flex-1 px-4 py-3 backdrop-blur-sm border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30 focus:border-opacity-40 ${
                  isMuted
                    ? "bg-gray-600 bg-opacity-20 border-gray-500 border-opacity-20 text-gray-400 cursor-not-allowed placeholder-gray-500"
                    : "bg-white bg-opacity-10 border-white border-opacity-20 text-white placeholder-gray-300"
                }`}
                disabled={isMuted}
              />
              <button
                type="submit"
                disabled={!isConnected || !newMessage.trim() || isMuted}
                className="px-6 py-3 bg-blue-500 bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed text-blue-100 font-medium rounded-full transition-all duration-200 text-sm border border-blue-400 border-opacity-30 hover:border-opacity-50"
              >
                Send
              </button>
            </div>
            {isMuted && (
              <p className="text-sm text-red-400 mt-2 text-center">
                You have been muted by the club owner and cannot send messages.
              </p>
            )}
          </form>
        </div>

        {/* Video Embedding Section */}
        <div className="mt-8 w-full max-w-2xl mx-auto">
          <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Share Highlights
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Post some dope sports videos on Youtube. Just paste the Youtube
              URL.
            </p>

            {/* Embed Form */}
            <form onSubmit={handleEmbedSubmit} className="mb-4">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  placeholder={
                    isMuted
                      ? "You are muted and cannot embed content"
                      : "Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                  }
                  className={`flex-1 px-4 py-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isMuted
                      ? "bg-gray-700 border-gray-500 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 border-gray-600 text-white"
                  }`}
                  disabled={isLoadingEmbed || isMuted}
                />
                <button
                  type="submit"
                  disabled={isLoadingEmbed || !embedUrl.trim() || isMuted}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-sm"
                >
                  {isLoadingEmbed ? "Loading..." : "Submit"}
                </button>
              </div>
              {isMuted && (
                <p className="text-sm text-red-400 mt-2">
                  You have been muted by the club owner and cannot embed
                  content.
                </p>
              )}
            </form>

            {/* Embedded Content Display */}
            {embedHtml && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-white">
                    Embedded Content
                  </h4>
                  <button
                    onClick={clearEmbed}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div
                  className="bg-gray-800 rounded-lg p-4 border border-gray-600"
                  dangerouslySetInnerHTML={{ __html: embedHtml }}
                />
              </div>
            )}

            {/* Example Usage */}
            {!embedHtml && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Example Usage:
                </h4>

                <code className="text-xs text-blue-400 break-all">
                  https://www.youtube.com/watch?v=dQw4w9WgXcQ
                </code>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8 space-y-4">
          <div>
            <a
              href="/clubs"
              className="inline-block px-6 py-3 hover:bg-[#1f1e1e] text-white font-semibold rounded-full transition-all duration-300 mr-4 bg-[#2e2d2d]"
            >
              ← Back to Clubs
            </a>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all duration-300"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Share Club</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
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
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Share Link */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Club Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl)}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this link to invite others to your club
                </p>
              </div>

              {/* Share Text */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Share Message
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={shareText}
                    readOnly
                    rows={3}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={() => copyToClipboard(shareText)}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm self-start"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Social Share Options */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Share On
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          shareText
                        )}`,
                        "_blank"
                      )
                    }
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Twitter
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                          shareUrl
                        )}`,
                        "_blank"
                      )
                    }
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Club Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white transition-colors"
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
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="overflow-y-auto flex-1">
              <form onSubmit={handleSettingsSubmit} className="p-6 space-y-6">
                {/* Club Name */}
                <div>
                  <label
                    htmlFor="settingsClubName"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Club Name
                  </label>
                  <input
                    type="text"
                    id="settingsClubName"
                    value={settingsForm.clubName}
                    onChange={(e) =>
                      handleSettingsChange("clubName", e.target.value)
                    }
                    placeholder="Enter club name"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Club Description */}
                <div>
                  <label
                    htmlFor="settingsDescription"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Description (Optional)
                  </label>
                  <textarea
                    id="settingsDescription"
                    value={settingsForm.description}
                    onChange={(e) =>
                      handleSettingsChange("description", e.target.value)
                    }
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
                    htmlFor="settingsMaxMembers"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Maximum Members
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="settingsMaxMembers"
                      min="1"
                      max="30"
                      value={settingsForm.maxMembers}
                      onChange={(e) =>
                        handleSettingsChange(
                          "maxMembers",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-gray-400 text-sm">1-30</span>
                    </div>
                  </div>
                </div>

                {/* Streaming Source */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Streaming Source
                  </label>
                  <select
                    value={settingsForm.streamingSource}
                    onChange={(e) =>
                      handleSettingsChange("streamingSource", e.target.value)
                    }
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="nfl">NFL Network</option>
                    <option value="youtube">Fubo TV</option>
                  </select>
                  <div className="text-sm text-gray-400 mt-2">
                    {settingsForm.streamingSource === "nfl" &&
                      "Stream live NFL content and highlights"}
                    {settingsForm.streamingSource === "youtube" &&
                      "Stream live TV and sports on Fubo TV"}
                  </div>
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
                        name="settingsPrivacy"
                        checked={!settingsForm.isPrivate}
                        onChange={() =>
                          handleSettingsChange("isPrivate", false)
                        }
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="ml-3">
                        <div className="text-white font-medium">
                          Public Club
                        </div>
                        <div className="text-sm text-gray-400">
                          Anyone can discover and join your club
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="settingsPrivacy"
                        checked={settingsForm.isPrivate}
                        onChange={() => handleSettingsChange("isPrivate", true)}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="ml-3">
                        <div className="text-white font-medium">
                          Private Club
                        </div>
                        <div className="text-sm text-gray-400">
                          Only people with an invite can join
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Buy Me a Coffee */}
                <div>
                  <label
                    htmlFor="settingsBuyMeCoffee"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Tip (Optional)
                  </label>
                  <input
                    type="text"
                    id="settingsBuyMeCoffee"
                    value={settingsForm.buyMeCoffeeUsername}
                    onChange={(e) =>
                      handleSettingsChange(
                        "buyMeCoffeeUsername",
                        e.target.value
                      )
                    }
                    placeholder="your-url"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Members can tip. Just go to buymeacoffee.com, create an
                    account, and input your url.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !settingsForm.clubName.trim() ||
                      updateClubMutation.isPending
                    }
                    className="flex-1 px-4 py-3 bg-[#f7f7f7] hover:bg-gray-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-[#000000] font-medium rounded-md transition-colors flex items-center justify-center"
                  >
                    {updateClubMutation.isPending ? (
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
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>

                {/* Member Management Section */}
                <div className="pt-4 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Manage Members
                  </h3>
                  {clubMembers.length === 0 ? (
                    <p className="text-gray-400 text-sm">
                      No members have joined this club yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {clubMembers.map((member) => (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {member.user.firstName?.charAt(0) ||
                                  member.user.username?.charAt(0) ||
                                  "U"}
                              </span>
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-gray-400 text-xs">
                                @{member.user.username}
                              </p>
                            </div>
                            {member.isMuted && (
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full">
                                Muted
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleMemberMute(member.userId, !member.isMuted)
                              }
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                member.isMuted
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "bg-yellow-600 hover:bg-yellow-700 text-white"
                              }`}
                            >
                              {member.isMuted ? "Unmute" : "Mute"}
                            </button>
                            <button
                              onClick={() => handleMemberRemove(member.userId)}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Muted members cannot send messages or embed content. Removed
                    members are banned and cannot rejoin.
                  </p>
                </div>

                {/* Delete Club Section */}
                <div className="pt-4 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={handleDeleteClub}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
                  >
                    Delete Club
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    This action cannot be undone
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
