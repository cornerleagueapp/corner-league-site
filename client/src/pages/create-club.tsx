import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ApiError, apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ClubsCache } from "@/lib/cache";
import { getAccessToken } from "@/lib/token";

export default function CreateClub() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    clubName: "",
    description: "",
    isPrivate: false,
    coOwners: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function runOwnerProbe() {
    try {
      const sample: any = await apiRequest("GET", "/clubs?limit=1");
      const knownOwner = "657663bf-f13c-45d6-b0f2-52a80592a5e9";

      console.log("[probe] knownOwner =", knownOwner);

      const slug = `probe-club-${Date.now()}`;

      const res = await apiRequest("POST", "/clubs", {
        name: "probe-club",
        slug,
        isPrivate: false,
        description: "probe",
        ownerId: knownOwner,
      });

      console.log("[probe] create result:", res);
    } catch (e: any) {
      console.error("[probe] failed", e?.body || e);
    }
  }

  function decodeJwt(): any | null {
    const raw = getAccessToken?.() || "";
    const jwt = raw.startsWith("Bearer ") ? raw.slice(7) : raw;
    if (!jwt || jwt.split(".").length !== 3) return null;
    try {
      let b64 = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      return JSON.parse(atob(b64));
    } catch {
      return null;
    }
  }

  function toId(v: unknown): string | null {
    if (typeof v === "number") return String(v);
    if (typeof v === "string" && v.trim().length > 0) return v;
    return null;
  }

  async function getBackendOwnerId(): Promise<string | null> {
    const payload = decodeJwt();
    const firebaseUid: string | undefined = payload?.user_id ?? payload?.sub;
    const email: string | undefined = payload?.email;

    if (firebaseUid) {
      try {
        const res: any = await apiRequest(
          "GET",
          `/users/get-user-by-uid/${encodeURIComponent(firebaseUid)}`
        );
        const id =
          res?.data?.user?.id ??
          res?.data?.id ??
          res?.user?.id ??
          res?.id ??
          res?.data?.userId ??
          res?.userId;
        const str = toId(id);
        if (str) return str;
        console.warn("[CreateClub] get-user-by-uid returned no id:", res);
      } catch (e) {
        console.warn("[CreateClub] get-user-by-uid failed:", e);
      }
    }

    if (email) {
      try {
        const res: any = await apiRequest(
          "GET",
          `/users/get-user-by-email/${encodeURIComponent(email)}`
        );
        const id =
          res?.data?.user?.id ??
          res?.data?.id ??
          res?.user?.id ??
          res?.id ??
          res?.data?.userId ??
          res?.userId;
        const str = toId(id);
        if (str) return str;
        console.warn("[CreateClub] get-user-by-email returned no id:", res);
      } catch (e) {
        console.warn("[CreateClub] get-user-by-email failed:", e);
      }
    }

    return null;
  }

  // helper to upload the club picture first and return a URL
  async function uploadClubImageToClubId(clubId: string, file: File) {
    const fd = new FormData();
    fd.append("club-picture", file, file.name);
    const res = await fetch(`/clubs/${clubId}/image`, {
      method: "PATCH",
      body: fd,
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return res.json();
  }

  async function resolveUsernamesToIds(usernames: string[]): Promise<string[]> {
    const results: string[] = [];
    for (const u of usernames) {
      try {
        const res: any = await apiRequest(
          "GET",
          `/users/get-user-by-username/${encodeURIComponent(u)}`
        );
        const id =
          res?.data?.user?.id ?? res?.data?.id ?? res?.user?.id ?? res?.id;
        if (typeof id === "string" && id) results.push(id);
      } catch (e) {
        console.warn("[CreateClub] resolve username failed:", u, e);
      }
    }
    return results;
  }

  async function findClubIdByName(name: string): Promise<string | null> {
    try {
      const res: any = await apiRequest(
        "GET",
        `/clubs?search=${encodeURIComponent(name)}&limit=1`
      );
      const list = res?.clubs ?? res?.data?.clubs ?? [];
      const match = (list as any[]).find(
        (c) => c?.name?.toLowerCase?.() === name.trim().toLowerCase()
      );
      return match?.id ?? null;
    } catch {
      return null;
    }
  }

  const toSlug = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 255);

  async function findClubIdBySlug(slug: string): Promise<string | null> {
    try {
      const res: any = await apiRequest(
        "GET",
        `/clubs?search=${encodeURIComponent(slug)}&limit=1`
      );
      const list = res?.clubs ?? res?.data?.clubs ?? [];
      const match = (list as any[]).find(
        (c) => c?.slug?.toLowerCase?.() === slug
      );
      return match?.id ?? null;
    } catch {
      return null;
    }
  }

  function makeSlug(s: string) {
    const base = s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    const out = base.slice(0, 50).replace(/^-+|-+$/g, "");
    return out || `club-${Date.now()}`;
  }

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  async function ensureOwnerId(): Promise<string> {
    const id = await getBackendOwnerId();
    if (!id || !UUID_RE.test(id)) {
      throw new ApiError(
        400,
        "We couldn't link your account to a user profile. Please sign out/in and try again."
      );
    }
    return id;
  }

  const createClubMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Missing user id. Please sign in again.");

      const name = formData.clubName.trim();
      const slug = makeSlug(name);

      if (await findClubIdByName(name)) {
        throw new ApiError(400, "A club with this name already exists.", {
          field: "clubName",
        });
      }
      if (await findClubIdBySlug(slug)) {
        throw new ApiError(400, "A club with this name/URL already exists.", {
          field: "clubName",
        });
      }

      const coOwnerIds = (
        await resolveUsernamesToIds(
          (formData.coOwners || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        )
      )
        .map(String)
        .filter((id) => UUID_RE.test(id))
        .filter((id) => id !== String(user?.id));

      const ownerId = await ensureOwnerId();
      console.log("[CreateClub] ownerId (backend UUID) =", ownerId);

      const byUid = await apiRequest(
        "GET",
        `/users/get-user-by-uid/${encodeURIComponent(
          decodeJwt()?.user_id || ""
        )}`
      ).catch(() => null);
      const byMail = await apiRequest(
        "GET",
        `/users/get-user-by-email/${encodeURIComponent(
          decodeJwt()?.email || ""
        )}`
      ).catch(() => null);

      console.log(
        "[CreateClub] sanity ids:",
        byUid?.data?.user?.id || byUid?.data?.id || byUid?.id,
        byMail?.data?.user?.id || byMail?.data?.id || byMail?.id
      );

      const payload: Record<string, any> = {
        name,
        slug,
        isPrivate: formData.isPrivate,
        ...(formData.description.trim()
          ? { description: formData.description.trim() }
          : {}),
        ownerId,
        ...(coOwnerIds.length
          ? { coOwners: coOwnerIds.map((id) => ({ id })) }
          : {}),
      };
      console.log("[CreateClub] create payload", payload);

      let createdId: string | null = null;
      try {
        const createdResp: any = await apiRequest("POST", "/clubs", payload);
        createdId =
          createdResp?.data?.club?.id ??
          createdResp?.club?.id ??
          createdResp?.id ??
          createdResp?._id ??
          createdResp?.clubId ??
          null;
      } catch (err: any) {
        const status = err instanceof ApiError ? err.status : undefined;
        const msg =
          err?.body?.response?.message ?? err?.body?.message ?? err?.message;

        if (
          status === 500 ||
          (status === 400 &&
            String(msg).toLowerCase().includes("validation") === false)
        ) {
          console.warn("[CreateClub] POST failed; probing by slug/name");
          createdId =
            (await findClubIdBySlug(slug)) || (await findClubIdByName(name));
          if (!createdId) throw err;
        } else {
          throw err;
        }
      }

      if (!createdId) throw new Error("Create club: missing id in response");

      if (imageFile) {
        try {
          await uploadClubImageToClubId(createdId, imageFile);
        } catch (e) {
          console.warn("[CreateClub] picture upload failed, continuing", e);
        }
      }

      return {
        data: {
          club: { id: createdId, name, description: formData.description },
        },
      };
    },

    onError: (error: any) => {
      console.error("[CreateClub] create error", error?.body || error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please sign in to continue…",
          variant: "destructive",
        });
        setTimeout(() => (window.location.href = "/api/login"), 400);
        return;
      }

      const resp = error?.body?.response ?? error?.body ?? {};
      const fieldMsgs = Array.isArray(resp?.errors)
        ? resp.errors
            .flatMap((e: any) => e?.errors || e?.message || [])
            .filter(Boolean)
            .map(String)
            .join("; ")
        : "";

      const msg =
        fieldMsgs ||
        (Array.isArray(resp?.message)
          ? resp.message.join("; ")
          : resp?.message) ||
        error?.message ||
        "Failed to create club. Please check your inputs and try again.";

      toast({ title: "Error", description: msg, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clubName.trim()) return;
    createClubMutation.mutate();
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
  };

  const onPickImage = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
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

        {process.env.NODE_ENV !== "production" && (
          <button
            type="button"
            onClick={runOwnerProbe}
            className="mt-2 text-xs underline text-gray-400 hover:text-white"
          >
            Run FK probe
          </button>
        )}

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

          {/* Description */}
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

          {/* Club Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Club Picture (Optional)
            </label>
            {imagePreview ? (
              <div className="mb-2">
                <img
                  src={imagePreview}
                  alt="Club preview"
                  className="w-full h-40 object-cover rounded-md border border-gray-700"
                />
              </div>
            ) : null}

            <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-md cursor-pointer hover:bg-gray-700">
              <svg
                className="w-5 h-5 text-gray-300"
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
                className="ml-3 text-sm text-gray-400 hover:text-white underline"
                onClick={() => onPickImage(null)}
              >
                Remove
              </button>
            )}
            {/* <p className="text-xs text-gray-500 mt-1">
              Recommended: landscape image
            </p> */}
          </div>

          {/* Privacy */}
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Co-Owners (comma-separated usernames)
            </label>
            <input
              type="text"
              value={formData.coOwners}
              onChange={(e) => handleInputChange("coOwners", e.target.value)}
              placeholder="alice, bob, charlie"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Summary */}
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
                <span className="text-gray-400">Privacy:</span>
                <span
                  className={
                    formData.isPrivate ? "text-orange-400" : "text-green-400"
                  }
                >
                  {formData.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              {formData.coOwners && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Co-Owners:</span>
                  <span className="text-white text-right max-w-xs truncate">
                    {formData.coOwners}
                  </span>
                </div>
              )}
              {imageFile && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Picture:</span>
                  <span className="text-gray-300">Selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={
                !formData.clubName.trim() ||
                createClubMutation.isPending ||
                uploading
              }
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {uploading || createClubMutation.isPending ? (
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {uploading ? "Uploading..." : "Creating..."}
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
