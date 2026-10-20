// pages/settings.tsx
import SocialPreferences from "@/components/community/SocialPreferences";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import TagsInput from "../../components/TagsInput";
import { Camera, CheckCircle2, Save, Bell, UserRound, X } from "lucide-react";

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
  const [activeSection, setActiveSection] = useState<
    "profile" | "notifications"
  >("profile");

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
    <div className="consumer-settings text-cl-ink">
      <main className="mx-auto w-full max-w-6xl pb-12">
        <header className="settings-heading">
          <h1>Account settings</h1>
          <p>Manage your public profile, notifications, and messages.</p>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="settings-section-sidebar lg:self-start">
            <nav
              aria-label="Settings sections"
              className="settings-section-nav"
            >
              <button
                type="button"
                onClick={() => setActiveSection("profile")}
                aria-pressed={activeSection === "profile"}
                aria-controls="settings-section-content"
                className="settings-section-button"
              >
                <UserRound className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("notifications")}
                aria-pressed={activeSection === "notifications"}
                aria-controls="settings-section-content"
                className="settings-section-button"
              >
                <Bell className="h-4 w-4 shrink-0" aria-hidden="true" />
                Notifications & messages
              </button>
            </nav>
          </aside>

          <section
            id="settings-section-content"
            aria-label={
              activeSection === "profile"
                ? "Profile settings"
                : "Notification settings"
            }
            className="min-w-0"
          >
            {activeSection === "notifications" && (
              <SocialPreferences key={String(user?.id)} />
            )}
            {activeSection === "profile" && (
              <div className="settings-content-card">
                <div className="border-b border-cl-border px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cl-accent/20 bg-cl-accent/10 text-cl-accent">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-cl-accent">
                        Profile Information
                      </div>
                      <p className="mt-1 text-sm text-cl-muted">
                        Manage the details shown on your public profile.
                      </p>
                    </div>
                  </div>
                </div>

                {loadingProfile ? (
                  <div className="p-6">
                    <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-6 text-sm text-cl-muted">
                      Loading profile…
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleProfileSubmit}
                    className="space-y-6 p-5 sm:p-6 md:p-8"
                  >
                    <div className="rounded-[24px] border border-cl-border bg-cl-subtle p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <img
                          src={
                            previewUrl ||
                            "https://placehold.co/96x96/111827/FFFFFF?text=Avatar"
                          }
                          alt="Profile preview"
                          className="h-20 w-20 rounded-full border border-cl-accent/20 bg-cl-canvas object-cover shadow-cl-panel"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-cl-ink">
                            Profile Picture
                          </div>
                          <p className="mt-1 text-xs leading-5 text-cl-muted">
                            Upload a clear image that represents your profile.
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-cl-accent/15 bg-cl-accent/10 px-4 text-xs font-black uppercase tracking-[0.14em] text-cl-accent hover:bg-cl-accent/15">
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
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-cl-border bg-cl-subtle px-4 text-xs font-black uppercase tracking-[0.14em] text-cl-muted hover:bg-cl-subtle hover:text-cl-ink"
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
                          className="field-input cursor-not-allowed"
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
                      <div className="mt-2 text-right text-xs text-cl-muted">
                        {profileForm.bio.length}/240
                      </div>
                    </Field>

                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-cl-muted">
                        Profile Tags
                      </label>

                      <div className="rounded-[18px] border border-cl-border bg-cl-subtle p-3">
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

                      <p className="mt-2 text-xs text-cl-muted">Max 2 tags.</p>
                    </div>

                    {anythingChanged ? (
                      <div className="rounded-[18px] border border-cl-accent/15 bg-cl-accent/[0.06] px-4 py-3 text-xs leading-6 text-cl-accent">
                        You have unsaved profile changes.
                      </div>
                    ) : (
                      <div className="settings-saved-state">
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Your profile is up to date.
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-cl-border pt-5 sm:flex-row sm:justify-end">
                      <button
                        type="submit"
                        disabled={saveAllMutation.isPending || !anythingChanged}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cl-accent px-6 text-xs font-black uppercase tracking-[0.16em] text-cl-contrast shadow-cl-panel transition hover:bg-cl-accent disabled:cursor-not-allowed disabled:opacity-50"
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
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-cl-muted">
        {label}
      </div>
      {children}
    </label>
  );
}
