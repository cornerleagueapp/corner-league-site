// src/pages/create-club.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ApiError, apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

// Build a safe slug that satisfies backend constraints (3–255 chars)
function makeSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

// Helper: find the new club id by slug, retrying briefly
async function findClubIdBySlug(slug: string): Promise<string | null> {
  const attempts = 6;
  for (let i = 0; i < attempts; i++) {
    try {
      const qs = new URLSearchParams({
        search: slug,
        limit: "1",
        sortBy: "createdAt",
        order: "DESC",
      }).toString();
      const res: any = await apiRequest("GET", `/clubs?${qs}`);
      const raw = res?.clubs?.[0]?.id;
      const id = raw == null ? null : String(raw);
      if (id) return id;
    } catch {}
    await new Promise((r) => setTimeout(r, i * 200));
  }
  return null;
}

async function uploadClubImage(clubId: string, file: File) {
  const fd = new FormData();
  fd.append("club-picture", file, file.name);
  // returns { message, clubPictureUrl }
  return apiRequest<{ clubPictureUrl?: string }>(
    "PATCH",
    `/clubs/${clubId}/image`,
    fd,
  );
}

// Resolve comma-separated usernames → array of backend user IDs (unchanged)
async function resolveUsernamesToIds(usernamesCsv: string): Promise<string[]> {
  const usernames = usernamesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!usernames.length) return [];

  const ids: string[] = [];
  for (const u of usernames) {
    try {
      const r: any = await apiRequest(
        "GET",
        `/users/get-user-by-username/${encodeURIComponent(u)}`,
      );
      const id =
        r?.data?.user?.id ?? r?.data?.id ?? r?.user?.id ?? r?.id ?? null;
      if (typeof id === "string" && id) ids.push(id);
    } catch {
      /* skip */
    }
  }
  return ids;
}

// Collect validation messages helper (unchanged)
function collectValidationMessages(body: any): string[] {
  if (!body) return [];
  const errs = body?.result?.response?.errors;
  if (Array.isArray(errs)) {
    return errs.flatMap((e: any) => {
      const prop = e?.property || e?.field || e?.path || "field";
      const msgs = (Array.isArray(e?.errors) ? e.errors : [e?.message]).filter(
        Boolean,
      );
      return (msgs as string[]).map((m) => `${prop}: ${m}`);
    });
  }
  if (Array.isArray(body?.errors)) {
    return body.errors
      .map((e: any) => e?.message || (e?.field ? `${e.field}: invalid` : null))
      .filter(Boolean);
  }
  if (Array.isArray(body?.message))
    return body.message.filter((m: any) => typeof m === "string");
  if (typeof body?.message === "string") return [body.message];
  if (typeof body?.error === "string") return [body.error];
  return [];
}

export default function CreateClub() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    clubName: "",
    description: "",
    isPrivate: false,
    coOwners: "", // CSV of usernames
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const createClub = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new ApiError(401, "Please sign in to create a club.");
      }

      // Build required slug
      const slug = makeSlug(formData.clubName);
      if (slug.length < 3) {
        throw new ApiError(
          400,
          "Club name must produce a slug of at least 3 characters.",
        );
      }

      // Resolve optional co-owners → IDs → CSV string (backend expects CSV)
      const coOwnerIdsArray = await resolveUsernamesToIds(formData.coOwners);
      const coOwnerIdsCsv = coOwnerIdsArray.join(",");

      const payload = {
        name: formData.clubName.trim(),
        slug,
        ownerId: user.id,
        description: formData.description.trim() || undefined,
        isPrivate: !!formData.isPrivate,
        coOwnerIds: coOwnerIdsCsv,
      };

      if (process.env.NODE_ENV !== "production") {
        console.groupCollapsed("[CreateClub] POST /clubs payload");
        console.log(payload);
        console.groupEnd();
      }

      // Create the club
      const created: any = await apiRequest("POST", "/clubs", payload);

      let newId: string | null =
        created?.data?.club?.id ??
        created?.club?.id ??
        created?.data?.id ??
        created?.id ??
        null;
      newId = newId == null ? null : String(newId);

      if (!newId) {
        newId = await findClubIdBySlug(slug);
      }

      if (newId && imageFile) {
        try {
          const r = await uploadClubImage(newId, imageFile);
          const newUrl = r?.clubPictureUrl;

          queryClient.setQueryData(
            ["club-details", newId, user?.id],
            (old: any) =>
              old ? { ...old, clubImage: newUrl ?? old.clubImage } : old,
          );

          queryClient.setQueryData(["clubs-and-myclubs"], (old: any) => {
            if (!old?.clubs) return old;
            return {
              ...old,
              clubs: old.clubs.map((c: any) =>
                c.id === newId ? { ...c, image: newUrl ?? c.image } : c,
              ),
            };
          });

          await Promise.allSettled([
            queryClient.invalidateQueries({
              queryKey: ["club-details", newId],
            }),
            queryClient.invalidateQueries({ queryKey: ["clubs-and-myclubs"] }),
            queryClient.invalidateQueries({ queryKey: ["/api/clubs"] }),
          ]);
        } catch (e: any) {}
      }

      return { id: newId, name: payload.name };
    },
    onSuccess: async ({ id, name }) => {
      toast({ title: "Club created 🎉", description: `“${name}” is live.` });

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: ["clubs-and-myclubs"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/clubs"] }),
      ]);

      // Navigate if we found an id; otherwise back to list
      navigate(id ? `/clubs/${id}` : "/clubs");
    },
    onError: (err: any) => {
      if (isUnauthorizedError(err)) {
        toast({
          title: "Sign in required",
          description: "Please sign in to create a club.",
          variant: "destructive",
        });
        const next = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth?next=${next}`;
        return;
      }

      if (process.env.NODE_ENV !== "production") {
        console.groupCollapsed("[CreateClub] create error");
        console.error("status:", err?.status);
        console.error("body:", err?.body);
        console.error("message:", err?.message);
        console.groupEnd();
      }

      const body = err?.body ?? {};
      const msgs = collectValidationMessages(body);
      const message =
        (msgs.length ? msgs.join(" • ") : null) ||
        body?.message ||
        body?.error ||
        err?.message ||
        "Failed to create club. Please try again.";

      toast({
        title: "Create failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clubName.trim()) {
      toast({ title: "Club name required", variant: "destructive" });
      return;
    }
    if (formData.clubName.trim().length < 3) {
      toast({
        title: "Club name too short",
        description: "Please enter at least 3 characters.",
        variant: "destructive",
      });
      return;
    }
    createClub.mutate();
  };

  const onPickImage = (file: File | null) => {
    setImageFile(file);
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  return (
    <div className="min-h-screen bg-cl-canvas text-cl-ink flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="relative text-center mb-8">
          <Link
            href="/clubs"
            className="absolute top-0 right-0 text-cl-muted hover:text-cl-ink transition-colors"
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
          <p className="text-cl-muted">
            Set up your sports club for fans to join
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Club Name */}
          <div>
            <label
              htmlFor="clubName"
              className="block text-sm font-medium text-cl-muted mb-2"
            >
              Club Name
            </label>
            <input
              id="clubName"
              type="text"
              value={formData.clubName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, clubName: e.target.value }))
              }
              placeholder="Enter club name"
              className="w-full px-4 py-3 bg-cl-subtle border border-cl-border rounded-md text-cl-ink placeholder-cl-muted focus:outline-none focus:ring-2 focus:ring-cl-accent focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-cl-muted mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Tell others about your club…"
              className="w-full px-4 py-3 bg-cl-subtle border border-cl-border rounded-md text-cl-ink placeholder-cl-muted focus:outline-none focus:ring-2 focus:ring-cl-accent focus:border-transparent resize-none"
            />
          </div>

          {/* Club Picture */}
          <div>
            <label className="block text-sm font-medium text-cl-muted mb-2">
              Club Picture (Optional)
            </label>

            {imagePreview && (
              <div className="mb-2">
                <img
                  src={imagePreview}
                  alt="Club preview"
                  className="w-full h-40 object-cover rounded-md border border-cl-border"
                />
              </div>
            )}

            <label className="inline-flex items-center gap-2 px-4 py-2 bg-cl-subtle border border-cl-border rounded-md cursor-pointer hover:bg-cl-subtle">
              <svg
                className="w-5 h-5 text-cl-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9"
                />
              </svg>
              <span>Choose image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
              />
            </label>
            {imageFile && (
              <button
                type="button"
                className="ml-3 text-sm text-cl-muted hover:text-cl-ink underline"
                onClick={() => onPickImage(null)}
              >
                Remove
              </button>
            )}
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-cl-muted mb-3">
              Club Privacy
            </label>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={!formData.isPrivate}
                  onChange={() =>
                    setFormData((p) => ({ ...p, isPrivate: false }))
                  }
                  className="w-4 h-4 text-cl-accent bg-cl-subtle border-cl-border focus:ring-cl-accent focus:ring-2"
                />
                <div className="ml-3">
                  <div className="text-cl-ink font-medium">Public Club</div>
                  <div className="text-sm text-cl-muted">
                    Anyone can discover and join your club
                  </div>
                </div>
              </label>

              {/* <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="privacy"
                  checked={formData.isPrivate}
                  onChange={() =>
                    setFormData((p) => ({ ...p, isPrivate: true }))
                  }
                  className="w-4 h-4 text-cl-accent bg-cl-subtle border-cl-border focus:ring-cl-accent focus:ring-2"
                />
                <div className="ml-3">
                  <div className="text-cl-ink font-medium">Private Club</div>
                  <div className="text-sm text-cl-muted">
                    Only people with an invite can join
                  </div>
                </div>
              </label> */}
            </div>
          </div>

          {/* Co-owners */}
          <div>
            <label className="block text-sm font-medium text-cl-muted mb-2">
              Co-Owners (comma-separated usernames)
            </label>
            <input
              type="text"
              value={formData.coOwners}
              onChange={(e) =>
                setFormData((p) => ({ ...p, coOwners: e.target.value }))
              }
              placeholder="alice, bob, charlie"
              className="w-full px-4 py-3 bg-cl-subtle border border-cl-border rounded-md text-cl-ink placeholder-cl-muted focus:outline-none focus:ring-2 focus:ring-cl-accent focus:border-transparent"
            />
          </div>

          {/* Summary */}
          <div className="bg-cl-subtle border border-cl-border rounded-md p-4">
            <h3 className="text-sm font-medium text-cl-muted mb-2">
              Club Summary
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-cl-muted">Name:</span>
                <span className="text-cl-ink">
                  {formData.clubName || "Not set"}
                </span>
              </div>
              {formData.description && (
                <div className="flex justify-between">
                  <span className="text-cl-muted">Description:</span>
                  <span className="text-cl-ink text-right max-w-xs truncate">
                    {formData.description}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-cl-muted">Privacy:</span>
                <span
                  className={
                    formData.isPrivate ? "text-cl-accent" : "text-cl-success"
                  }
                >
                  {formData.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              {formData.coOwners && (
                <div className="flex justify-between">
                  <span className="text-cl-muted">Co-Owners:</span>
                  <span className="text-cl-ink text-right max-w-xs truncate">
                    {formData.coOwners}
                  </span>
                </div>
              )}
              {imageFile && (
                <div className="flex justify-between">
                  <span className="text-cl-muted">Picture:</span>
                  <span className="text-cl-muted">Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={createClub.isPending || !formData.clubName.trim()}
              className="w-full px-4 py-3 bg-cl-surface text-cl-ink font-medium rounded-md hover:bg-cl-subtle disabled:bg-cl-subtle disabled:text-cl-ink disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {createClub.isPending ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-cl-ink"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating…
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
