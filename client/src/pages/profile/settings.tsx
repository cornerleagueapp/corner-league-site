// pages/settings.tsx
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import TagsInput from "../../components/TagsInput";
import {
  Camera,
  CheckCircle2,
  Save,
  Settings as SettingsIcon,
  UserRound,
  X,
} from "lucide-react";

type ProfileFromDb = {
  id: string | number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string | null;
  profilePicture?: string | null;
  tags?: { profile?: string[] } | null;
};

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const originalEmailRef = useRef<string>("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: "",
    tags: [] as string[],
  });

  const [initialProfile, setInitialProfile] = useState<{
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    bio: string;
    tags: string[];
  } | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [activeSection, setActiveSection] = useState<"profile">("profile");

  const nameChanged =
    !!initialProfile &&
    (profileForm.firstName.trim() !== initialProfile.firstName ||
      profileForm.lastName.trim() !== initialProfile.lastName);

  const usernameChanged =
    !!initialProfile && profileForm.username.trim() !== initialProfile.username;

  const bioChanged =
    !!initialProfile && (profileForm.bio || "") !== (initialProfile.bio || "");

  const tagsChanged =
    !!initialProfile &&
    JSON.stringify(profileForm.tags ?? []) !==
      JSON.stringify(initialProfile.tags ?? []);

  const pictureChanged = !!profilePicFile;

  const anythingChanged =
    nameChanged ||
    usernameChanged ||
    bioChanged ||
    tagsChanged ||
    pictureChanged;

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        setLoadingProfile(true);

        const uname = user?.username ?? "";
        if (!uname) throw new Error("No username on session user");

        const res = await apiRequest<{ data: ProfileFromDb }>(
          "GET",
          `/users/get-user-by-username/${encodeURIComponent(uname)}`,
        );

        const u = res?.data;
        if (!u) throw new Error("Profile not found");

        if (ignore) return;

        originalEmailRef.current = u.email || "";

        const loaded = {
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          username: u.username || "",
          email: u.email || "",
          bio: u.bio || "",
          tags: u.tags?.profile ?? [],
        };

        setProfileForm(loaded);
        setInitialProfile(loaded);
        setPreviewUrl(u.profilePicture || null);
      } catch (e: any) {
        if (!ignore) {
          toast({
            title: "Couldn’t load profile",
            description: e?.message || "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!ignore) setLoadingProfile(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user?.username, toast]);

  async function patchName() {
    return apiRequest("PATCH", "/users/update-name", {
      email: profileForm.email,
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
    });
  }

  async function patchUsername() {
    return apiRequest("PATCH", "/users/update-username", {
      email: originalEmailRef.current || profileForm.email,
      username: profileForm.username,
    });
  }

  async function putBioAndTags() {
    return apiRequest("PUT", "/users/update-bio", {
      email: profileForm.email,
      bio: profileForm.bio,
      tags: { profile: profileForm.tags },
    });
  }

  function hardLogout() {
    try {
      localStorage.clear();
    } catch {}

    queryClient.clear();
    window.location.replace("/auth?reason=renamed");
  }

  async function postProfilePic() {
    if (!profilePicFile) return;

    const form = new FormData();
    form.append("profilePicture", profilePicFile);
    form.append("email", profileForm.email);

    const res = await apiFetch("/users/update-profile-picture", {
      method: "POST",
      body: form,
    });

    if (!res.ok) throw new Error(await res.text());

    return res.json();
  }

  const saveAllMutation = useMutation({
    mutationFn: async () => {
      const tasks: Promise<any>[] = [];

      if (nameChanged) tasks.push(patchName());
      if (usernameChanged) tasks.push(patchUsername());
      if (bioChanged || tagsChanged) tasks.push(putBioAndTags());
      if (pictureChanged) tasks.push(postProfilePic());

      if (tasks.length === 0) return;

      await Promise.all(tasks);
    },
    onSuccess: async () => {
      if (usernameChanged) {
        toast({
          title: "Username updated",
          description: "Please sign in again to refresh your session.",
        });
        hardLogout();
        return;
      }

      toast({
        title: "Profile saved",
        description: "Your profile has been updated.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      await queryClient.invalidateQueries();

      setProfilePicFile(null);
      setInitialProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        username: profileForm.username,
        email: profileForm.email,
        bio: profileForm.bio,
        tags: profileForm.tags,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });

        setTimeout(() => {
          window.location.href = "/login";
        }, 500);

        return;
      }

      toast({
        title: "Update failed",
        description:
          (error?.status === 409 && "Username or email already in use.") ||
          error?.message ||
          "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAllMutation.mutate();
  };

  const handleFile = (f: File | null) => {
    setProfilePicFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : previewUrl);
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:rounded-[38px] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Account
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Profile Settings
                </div>
              </div>

              <h1 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Account{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Settings
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Update your public profile, username, bio, tags, and profile
                picture.
              </p>
            </div>

            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.14)]">
              <SettingsIcon className="h-6 w-6" />
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/90 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.26)] lg:self-start">
            <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              <button
                onClick={() => setActiveSection("profile")}
                className={`inline-flex min-w-max items-center gap-2 rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition lg:w-full lg:min-w-0 lg:justify-start lg:rounded-[18px] ${
                  activeSection === "profile"
                    ? "bg-cyan-300 text-[#06111d] shadow-[0_0_24px_rgba(34,211,238,0.20)]"
                    : "border border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UserRound className="h-4 w-4" />
                Profile
              </button>
            </nav>
          </aside>

          <section className="min-w-0">
            {activeSection === "profile" && (
              <div className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
                <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                        Profile Information
                      </div>
                      <p className="mt-1 text-sm text-white/55">
                        Manage the details shown on your public profile.
                      </p>
                    </div>
                  </div>
                </div>

                {loadingProfile ? (
                  <div className="p-6">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                      Loading profile…
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleProfileSubmit}
                    className="space-y-6 p-5 sm:p-6 md:p-8"
                  >
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <img
                          src={
                            previewUrl ||
                            "https://placehold.co/96x96/111827/FFFFFF?text=Avatar"
                          }
                          alt="Profile preview"
                          className="h-20 w-20 rounded-full border border-cyan-300/20 bg-black object-cover shadow-[0_0_28px_rgba(34,211,238,0.12)]"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white">
                            Profile Picture
                          </div>
                          <p className="mt-1 text-xs leading-5 text-white/50">
                            Upload a clear image that represents your profile.
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 hover:bg-cyan-300/15">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleFile(e.target.files?.[0] ?? null)
                                }
                              />
                              <Camera className="h-4 w-4" />
                              Choose File
                            </label>

                            {profilePicFile ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setProfilePicFile(null);
                                  setPreviewUrl(
                                    user?.profilePicture || previewUrl,
                                  );
                                }}
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.14em] text-white/65 hover:bg-white/10 hover:text-white"
                              >
                                <X className="h-4 w-4" />
                                Clear
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="First Name">
                        <input
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm((s) => ({
                              ...s,
                              firstName: e.target.value,
                            }))
                          }
                          className="field-input"
                          required
                        />
                      </Field>

                      <Field label="Last Name">
                        <input
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm((s) => ({
                              ...s,
                              lastName: e.target.value,
                            }))
                          }
                          className="field-input"
                          required
                        />
                      </Field>

                      <Field label="Username">
                        <input
                          value={profileForm.username}
                          onChange={(e) =>
                            setProfileForm((s) => ({
                              ...s,
                              username: e.target.value,
                            }))
                          }
                          className="field-input"
                          required
                        />
                      </Field>

                      <Field label="Email Address">
                        <input
                          type="email"
                          value={profileForm.email}
                          disabled
                          onChange={(e) =>
                            setProfileForm((s) => ({
                              ...s,
                              email: e.target.value,
                            }))
                          }
                          title="Email changes are disabled for now"
                          className="field-input cursor-not-allowed opacity-65"
                          required
                        />
                      </Field>
                    </div>

                    <Field label="Bio">
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm((s) => ({
                            ...s,
                            bio: e.target.value,
                          }))
                        }
                        rows={4}
                        maxLength={240}
                        className="field-input min-h-32 py-3"
                        placeholder="Tell people a bit about yourself…"
                      />
                      <div className="mt-2 text-right text-xs text-white/40">
                        {profileForm.bio.length}/240
                      </div>
                    </Field>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                        Profile Tags
                      </label>

                      <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-3">
                        <TagsInput
                          value={profileForm.tags}
                          max={2}
                          onMaxReached={() =>
                            toast({
                              title: "Tag limit reached",
                              description: "You can add up to 2 profile tags.",
                              variant: "destructive",
                            })
                          }
                          onChange={(tags) =>
                            setProfileForm((s) => ({ ...s, tags }))
                          }
                          placeholder="Type a tag and press Enter"
                        />
                      </div>

                      <p className="mt-2 text-xs text-white/45">Max 2 tags.</p>
                    </div>

                    {anythingChanged ? (
                      <div className="rounded-[18px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-4 py-3 text-xs leading-6 text-[#FFB199]/80">
                        You have unsaved profile changes.
                      </div>
                    ) : (
                      <div className="rounded-[18px] border border-emerald-400/15 bg-emerald-500/[0.06] px-4 py-3 text-xs leading-6 text-emerald-200/80">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Your profile is up to date.
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="submit"
                        disabled={saveAllMutation.isPending || !anythingChanged}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saveAllMutation.isPending ? (
                          <svg
                            className="-ml-1 h-4 w-4 animate-spin"
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
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {saveAllMutation.isPending
                          ? "Saving..."
                          : "Update Profile"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <style>{`
        .field-input {
          width: 100%;
          min-height: 48px;
          border-radius: 14px;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(255,255,255,0.10);
          padding: 0 14px;
          color: white;
          outline: none;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.34);
        }

        .field-input:focus {
          border-color: rgba(103,232,249,0.34);
          box-shadow: 0 0 0 3px rgba(34,211,238,0.10);
          background: rgba(255,255,255,0.075);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
        {label}
      </div>
      {children}
    </label>
  );
}
