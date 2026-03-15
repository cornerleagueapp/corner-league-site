import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { PageSEO } from "@/seo/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Search, Shield, Clock3, Eye, ArrowLeft } from "lucide-react";

type ClaimStatus = "pending" | "approved" | "rejected";

type ClaimListItem = {
  id: string;
  idCardImageUrl?: string | null;
  additionalInfo?: string | null;
  status: ClaimStatus;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  claimant: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profilePicture?: string | null;
  };
  athlete: {
    id: string;
    name?: string;
    image?: string | null;
    age?: number;
    origin?: string | null;
  };
  reviewedBy?: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  } | null;
};

type ClaimDetailsResponse = {
  claim: ClaimListItem & {
    athlete: ClaimListItem["athlete"] & {
      bio?: string | null;
      height?: number | null;
      weight?: number | null;
    };
  };
};

function timeAgo(d?: string | null) {
  if (!d) return "";
  const now = Date.now();
  const diff = Math.max(0, now - new Date(d).getTime());
  const m = 60_000;
  const h = 60 * m;
  const day = 24 * h;
  if (diff < h) return `${Math.floor(diff / m) || 1}m ago`;
  if (diff < day) return `${Math.floor(diff / h)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  const cls =
    status === "approved"
      ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/20"
      : status === "rejected"
        ? "bg-red-500/15 text-red-200 border border-red-400/20"
        : "bg-yellow-500/15 text-yellow-200 border border-yellow-400/20";

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function AdminAthleteClaimsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const viewerRole = String((user as any)?.role ?? "").toUpperCase();
  const viewerId = user?.id ? String(user.id) : null;
  const isSuperAdmin = viewerRole === "SUPER_ADMIN";

  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<
    ClaimDetailsResponse["claim"] | null
  >(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "pending" | "approved" | "rejected"
  >("pending");
  const [search, setSearch] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?next=%2Fadmin%2Fathlete-claims", { replace: true });
      return;
    }
    if (!isSuperAdmin) {
      navigate("/profile", { replace: true });
    }
  }, [authLoading, user, isSuperAdmin, navigate]);

  async function loadClaims() {
    try {
      setLoading(true);

      const qs = new URLSearchParams();
      qs.set("page", "1");
      qs.set("limit", "50");
      qs.set("order", "DESC");
      if (statusFilter !== "ALL") qs.set("status", statusFilter);

      const res = await apiRequest<any>(
        "GET",
        `/athlete-claims?${qs.toString()}`,
      );

      const arr = res?.claims ?? res?.data?.claims ?? res?.data ?? [];

      setClaims(Array.isArray(arr) ? arr : []);
    } catch (e: any) {
      toast({
        title: "Failed to load claims",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) return;
    void loadClaims();
  }, [statusFilter, isSuperAdmin]);

  async function loadClaimDetails(claimId: string) {
    try {
      setDetailsLoading(true);
      setSelectedClaimId(claimId);

      const res = await apiRequest<ClaimDetailsResponse>(
        "GET",
        `/athlete-claims/${encodeURIComponent(claimId)}`,
      );

      const claim = res?.claim ?? (res as any)?.data?.claim ?? null;
      setSelectedClaim(claim);
      setReviewNote(claim?.reviewNote ?? "");
    } catch (e: any) {
      toast({
        title: "Failed to load claim details",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleReview(status: "approved" | "rejected") {
    if (!selectedClaimId || !viewerId) return;

    try {
      setReviewLoading(true);

      await apiRequest(
        "PATCH",
        `/athlete-claims/${encodeURIComponent(selectedClaimId)}/review`,
        {
          status,
          reviewedByUserId: viewerId,
          reviewNote: reviewNote?.trim() || undefined,
        },
      );

      toast({
        title: status === "approved" ? "Claim approved" : "Claim rejected",
      });

      await loadClaims();
      await loadClaimDetails(selectedClaimId);
    } catch (e: any) {
      toast({
        title: "Review failed",
        description: e?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setReviewLoading(false);
    }
  }

  const filteredClaims = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return claims;

    return claims.filter((c) => {
      const athleteName = String(c.athlete?.name ?? "").toLowerCase();
      const username = String(c.claimant?.username ?? "").toLowerCase();
      const fullName =
        `${c.claimant?.firstName ?? ""} ${c.claimant?.lastName ?? ""}`.toLowerCase();
      const email = String(c.claimant?.email ?? "").toLowerCase();

      return (
        athleteName.includes(q) ||
        username.includes(q) ||
        fullName.includes(q) ||
        email.includes(q)
      );
    });
  }, [claims, search]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#090D16] text-white grid place-items-center">
        <PageSEO title="Admin Claims • Corner League" />
        <div className="animate-pulse text-white/70">Loading admin claims…</div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-[#090D16] text-white">
      <PageSEO title="Admin Claims • Corner League" />

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => navigate("/profile")}
              className="mb-3 inline-flex items-center gap-2 text-white/70 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-500/20 border border-violet-400/20 grid place-items-center">
                <Shield size={18} className="text-violet-200" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold">
                  Admin Claims Dashboard
                </h1>
                <p className="text-white/60 text-sm">
                  Review athlete profile claims and approve or reject them.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["pending", "approved", "rejected", "ALL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-10 px-4 rounded-full border text-sm ${
                  statusFilter === s
                    ? "bg-white text-black border-white"
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                }`}
              >
                {s === "ALL" ? "ALL" : s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <Card className="bg-white/5 border-white/10 p-4">
              <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 h-11">
                <Search size={16} className="text-white/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search athlete, username, email..."
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:text-white/40"
                />
              </div>
            </Card>

            <div className="space-y-3">
              {filteredClaims.length === 0 ? (
                <Card className="bg-white/5 border-white/10 p-6 text-white/60">
                  No claims found.
                </Card>
              ) : (
                filteredClaims.map((claim) => {
                  const active = selectedClaimId === claim.id;
                  return (
                    <button
                      key={claim.id}
                      onClick={() => loadClaimDetails(claim.id)}
                      className={`w-full text-left rounded-xl border p-4 transition ${
                        active
                          ? "bg-violet-500/10 border-violet-400/30"
                          : "bg-white/5 border-white/10 hover:bg-white/7"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">
                            {claim.athlete?.name || "Unknown Athlete"}
                          </div>
                          <div className="text-sm text-white/60 mt-1">
                            @{claim.claimant?.username || "unknown"} •{" "}
                            {claim.claimant?.email || "No email"}
                          </div>
                        </div>
                        <StatusBadge status={claim.status} />
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                        <Clock3 size={13} />
                        Submitted {timeAgo(claim.createdAt)}
                      </div>

                      <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/80">
                        <Eye size={14} />
                        View details
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="xl:col-span-3">
            <Card className="bg-white/5 border-white/10 p-5 min-h-[500px]">
              {!selectedClaimId && (
                <div className="h-full grid place-items-center text-white/50">
                  Select a claim to review.
                </div>
              )}

              {selectedClaimId && detailsLoading && (
                <div className="h-full grid place-items-center text-white/60">
                  Loading claim details…
                </div>
              )}

              {selectedClaim && !detailsLoading && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl text-white font-semibold">
                        {selectedClaim.athlete?.name || "Athlete Claim"}
                      </h2>
                      <p className="text-white text-sm mt-1">
                        Submitted by @
                        {selectedClaim.claimant?.username || "unknown"}
                      </p>
                    </div>

                    <StatusBadge status={selectedClaim.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="text-sm text-white mb-2">Claimant</div>
                      <div className="space-y-1 text-sm">
                        <div className="text-white">
                          <span className="text-white/60">Username:</span>{" "}
                          {selectedClaim.claimant?.username || "—"}
                        </div>
                        <div className="text-white">
                          <span className="text-white/60">Name:</span>{" "}
                          {selectedClaim.claimant?.firstName || ""}{" "}
                          {selectedClaim.claimant?.lastName || ""}
                        </div>
                        <div className="text-white">
                          <span className="text-white/60">Email:</span>{" "}
                          {selectedClaim.claimant?.email || "—"}
                        </div>
                      </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="text-sm text-white mb-2">Athlete</div>
                      <div className="space-y-1 text-sm">
                        <div className="text-white">
                          <span className="text-white/60">Name:</span>{" "}
                          {selectedClaim.athlete?.name || "—"}
                        </div>
                        <div className="text-white">
                          <span className="text-white/60">Origin:</span>{" "}
                          {selectedClaim.athlete?.origin || "—"}
                        </div>
                        <div className="text-white">
                          <span className="text-white/60">Age:</span>{" "}
                          {selectedClaim.athlete?.age ?? "—"}
                        </div>
                      </div>
                    </Card>
                  </div>

                  <Card className="bg-white/5 border-white/10 p-4">
                    <div className="text-sm text-white/60 mb-2">
                      Additional Info
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap">
                      {selectedClaim.additionalInfo?.trim() ||
                        "No additional info provided."}
                    </p>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4">
                    <div className="text-sm text-white/60 mb-3">
                      Uploaded ID Image
                    </div>

                    {selectedClaim.idCardImageUrl ? (
                      <img
                        src={selectedClaim.idCardImageUrl}
                        alt="Uploaded ID"
                        className="w-full max-h-[520px] object-contain rounded-xl border border-white/10 bg-black/20"
                      />
                    ) : (
                      <div className="text-white/50 text-sm">
                        No image available.
                      </div>
                    )}
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-4">
                    <div className="text-sm text-white/60 mb-2">
                      Review Note
                    </div>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40"
                      placeholder="Add a note for this approval or rejection..."
                      disabled={
                        selectedClaim.status !== "pending" || reviewLoading
                      }
                    />
                  </Card>

                  {selectedClaim.status === "pending" ? (
                    <div className="flex flex-wrap gap-3 justify-end">
                      <Button
                        onClick={() => handleReview("rejected")}
                        disabled={reviewLoading}
                        className="bg-red-500/90 text-white hover:bg-red-600"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>

                      <Button
                        onClick={() => handleReview("approved")}
                        disabled={reviewLoading}
                        className="bg-emerald-500 text-white hover:bg-emerald-600"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-white/50">
                      This claim has already been reviewed.
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
