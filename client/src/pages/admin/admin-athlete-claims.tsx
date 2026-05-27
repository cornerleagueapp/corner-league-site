import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { PageSEO } from "@/seo/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  X,
  Search,
  Shield,
  Clock3,
  Eye,
  ArrowLeft,
  UserRound,
  BadgeCheck,
  FileText,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

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
      ? "border border-emerald-400/20 bg-emerald-500/15 text-emerald-200"
      : status === "rejected"
        ? "border border-red-400/20 bg-red-500/15 text-red-200"
        : "border border-[#FF6B35]/25 bg-[#FF6B35]/10 text-[#FFB199]";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${cls}`}
    >
      {status}
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
      <div className="relative grid min-h-dvh place-items-center overflow-x-hidden bg-[#030913] text-white">
        <PageSEO title="Admin Claims • Corner League" />

        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
          <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.14)]">
          Loading admin claims…
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <PageSEO title="Admin Claims • Corner League" />

      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:rounded-[38px] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <button
                onClick={() => navigate("/profile")}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Admin Review
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Athlete Claims
                </div>
              </div>

              <h1 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Claims{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Review athlete profile claims and approve or reject verified
                racer ownership requests.
              </p>
            </div>

            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.14)]">
              <Shield className="h-6 w-6" />
            </div>
          </div>

          <div className="relative mt-6 flex flex-wrap gap-2">
            {(["pending", "approved", "rejected", "ALL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-11 rounded-full border px-4 text-xs font-black uppercase tracking-[0.14em] transition ${
                  statusFilter === s
                    ? "border-cyan-300 bg-cyan-300 text-[#06111d] shadow-[0_0_26px_rgba(34,211,238,0.20)]"
                    : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {s === "ALL" ? "ALL" : s}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-2">
            <Card className="overflow-hidden rounded-[26px] border border-cyan-300/10 bg-[#07111F]/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.26)]">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-cyan-300/75">
                Search Claims
              </div>

              <div className="flex h-12 items-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.05] px-3">
                <Search size={16} className="shrink-0 text-white/45" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search athlete, username, email..."
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
              </div>
            </Card>

            <div className="space-y-3">
              {filteredClaims.length === 0 ? (
                <Card className="rounded-[26px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                  No claims found.
                </Card>
              ) : (
                filteredClaims.map((claim) => {
                  const active = selectedClaimId === claim.id;
                  return (
                    <button
                      key={claim.id}
                      onClick={() => loadClaimDetails(claim.id)}
                      className={`w-full rounded-[24px] border p-4 text-left transition ${
                        active
                          ? "border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_34px_rgba(34,211,238,0.12)]"
                          : "border-white/10 bg-white/[0.045] hover:border-cyan-300/20 hover:bg-white/[0.065]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-black uppercase tracking-[-0.01em] text-white">
                            {claim.athlete?.name || "Unknown Athlete"}
                          </div>
                          <div className="mt-1 truncate text-sm text-white/55">
                            @{claim.claimant?.username || "unknown"} •{" "}
                            {claim.claimant?.email || "No email"}
                          </div>
                        </div>

                        <StatusBadge status={claim.status} />
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/45">
                        <span className="inline-flex items-center gap-2">
                          <Clock3 size={13} />
                          Submitted {timeAgo(claim.createdAt)}
                        </span>

                        <span className="inline-flex items-center gap-2 text-cyan-200/80">
                          <Eye size={14} />
                          View details
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="xl:col-span-3">
            <Card className="min-h-[560px] overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
              {!selectedClaimId && (
                <div className="grid min-h-[560px] place-items-center p-6 text-center">
                  <div>
                    <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-lg font-black uppercase text-white">
                      Select a claim
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      Choose a claim from the list to review details.
                    </p>
                  </div>
                </div>
              )}

              {selectedClaimId && detailsLoading && (
                <div className="grid min-h-[560px] place-items-center p-6 text-sm text-white/60">
                  Loading claim details…
                </div>
              )}

              {selectedClaim && !detailsLoading && (
                <div>
                  <div className="border-b border-white/10 p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          Claim Review
                        </div>

                        <h2 className="break-words text-2xl font-black uppercase tracking-[-0.03em] text-white">
                          {selectedClaim.athlete?.name || "Athlete Claim"}
                        </h2>

                        <p className="mt-2 text-sm text-white/55">
                          Submitted by @
                          {selectedClaim.claimant?.username || "unknown"}
                        </p>
                      </div>

                      <StatusBadge status={selectedClaim.status} />
                    </div>
                  </div>

                  <div className="space-y-5 p-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300/75">
                          <UserRound className="h-4 w-4" />
                          Claimant
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="text-white">
                            <span className="text-white/50">Username:</span>{" "}
                            {selectedClaim.claimant?.username || "—"}
                          </div>
                          <div className="text-white">
                            <span className="text-white/50">Name:</span>{" "}
                            {selectedClaim.claimant?.firstName || ""}{" "}
                            {selectedClaim.claimant?.lastName || ""}
                          </div>
                          <div className="break-words text-white">
                            <span className="text-white/50">Email:</span>{" "}
                            {selectedClaim.claimant?.email || "—"}
                          </div>
                        </div>
                      </Card>

                      <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#FFB199]/80">
                          <Sparkles className="h-4 w-4" />
                          Athlete
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="text-white">
                            <span className="text-white/50">Name:</span>{" "}
                            {selectedClaim.athlete?.name || "—"}
                          </div>
                          <div className="text-white">
                            <span className="text-white/50">Origin:</span>{" "}
                            {selectedClaim.athlete?.origin || "—"}
                          </div>
                          <div className="text-white">
                            <span className="text-white/50">Age:</span>{" "}
                            {selectedClaim.athlete?.age ?? "—"}
                          </div>
                        </div>
                      </Card>
                    </div>

                    <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                      <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300/75">
                        Additional Info
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                        {selectedClaim.additionalInfo?.trim() ||
                          "No additional info provided."}
                      </p>
                    </Card>

                    <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300/75">
                        <ImageIcon className="h-4 w-4" />
                        Uploaded ID Image
                      </div>

                      {selectedClaim.idCardImageUrl ? (
                        <img
                          src={selectedClaim.idCardImageUrl}
                          alt="Uploaded ID"
                          className="max-h-[520px] w-full rounded-[20px] border border-white/10 bg-black/30 object-contain"
                        />
                      ) : (
                        <div className="rounded-[18px] border border-white/10 bg-black/20 p-5 text-sm text-white/50">
                          No image available.
                        </div>
                      )}
                    </Card>

                    <Card className="rounded-[24px] border border-white/10 bg-white/[0.045] p-4">
                      <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300/75">
                        Review Note
                      </div>
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        rows={4}
                        className="w-full rounded-[16px] border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                        placeholder="Add a note for this approval or rejection..."
                        disabled={
                          selectedClaim.status !== "pending" || reviewLoading
                        }
                      />
                    </Card>

                    {selectedClaim.status === "pending" ? (
                      <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                        <Button
                          onClick={() => handleReview("rejected")}
                          disabled={reviewLoading}
                          className="h-12 rounded-full border border-red-400/15 bg-red-500/15 px-6 text-xs font-black uppercase tracking-[0.16em] text-red-100 hover:bg-red-500/25"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>

                        <Button
                          onClick={() => handleReview("approved")}
                          disabled={reviewLoading}
                          className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/50">
                        This claim has already been reviewed.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
