// pages/settings.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiFetch, apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import TagsInput from "../components/TagsInput";

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
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const originalEmailRef = useRef<string>("");

  // -------- form state --------
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    bio: "",
    tags: [] as string[],
  });

  // snapshot of what we loaded from the DB to detect changes
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

  // const [passwordForm, setPasswordForm] = useState({
  //   currentPassword: "",
  //   newPassword: "",
  //   confirmPassword: "",
  // });

  // const [deleteAccountForm, setDeleteAccountForm] = useState({
  //   confirmText: "",
  //   password: "",
  // });

  const [activeSection, setActiveSection] = useState<"profile">("profile");
  // const [activeSection, setActiveSection] = useState<
  //   "profile" | "password" | "delete"
  // >("profile");

  const nameChanged =
    !!initialProfile &&
    (profileForm.firstName.trim() !== initialProfile.firstName ||
      profileForm.lastName.trim() !== initialProfile.lastName);

  const usernameChanged =
    !!initialProfile && profileForm.username.trim() !== initialProfile.username;

  const emailChanged =
    !!initialProfile && profileForm.email.trim() !== initialProfile.email;

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
    // emailChanged ||
    bioChanged ||
    tagsChanged ||
    pictureChanged;

  // -------- load profile from DB --------
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoadingProfile(true);

        const uname = user?.username ?? "";
        if (!uname) throw new Error("No username on session user");

        const res = await apiRequest<{ data: ProfileFromDb }>(
          "GET",
          `/users/get-user-by-username/${encodeURIComponent(uname)}`
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
  }, [user?.username]);

  async function patchName() {
    return apiRequest("PATCH", "/users/update-name", {
      email: profileForm.email,
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
    });
  }

  async function patchUsername() {
    return apiRequest("PATCH", "/users/update-username", {
      email: originalEmailRef.current || profileForm.email, // stable identifier
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
      if (usernameChanged) tasks.push(patchUsername()); // ⬅ removed emailChanged
      if (bioChanged || tagsChanged) tasks.push(putBioAndTags());
      if (pictureChanged) tasks.push(postProfilePic());
      if (tasks.length === 0) return;
      await Promise.all(tasks);
    },
    onSuccess: async () => {
      // If username changed, force a quick re-login to refresh session/links
      if (usernameChanged) {
        toast({
          title: "Username updated",
          description: "Please sign in again to refresh your session.",
        });
        hardLogout();
        return; // stop here
      }

      // Otherwise, do your normal success flow
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

  // -------- handlers --------
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAllMutation.mutate();
  };

  const handleFile = (f: File | null) => {
    setProfilePicFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : previewUrl);
  };

  // const handlePasswordSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (passwordForm.newPassword !== passwordForm.confirmPassword) {
  //     toast({
  //       title: "Password mismatch",
  //       description: "New password and confirm password do not match.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
  //   if (passwordForm.newPassword.length < 6) {
  //     toast({
  //       title: "Password too short",
  //       description: "Password must be at least 6 characters long.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
  //   changePasswordMutation.mutate(passwordForm);
  // };

  // const forgotPasswordMutation = useMutation({
  //   mutationFn: async () =>
  //     apiRequest("POST", "/user/forgot-password", {
  //       email: profileForm.email,
  //     }),
  //   onSuccess: () =>
  //     toast({
  //       title: "Password reset email sent",
  //       description:
  //         "Check your email for password reset instructions from support@cornerleague.com.",
  //     }),
  //   onError: (error) =>
  //     toast({
  //       title: "Request failed",
  //       description: error?.message || "Please try again.",
  //       variant: "destructive",
  //     }),
  // });

  // const changePasswordMutation = useMutation({
  //   mutationFn: async (data: typeof passwordForm) =>
  //     apiRequest("PUT", "/user/password", {
  //       currentPassword: data.currentPassword,
  //       newPassword: data.newPassword,
  //     }),
  //   onSuccess: () => {
  //     setPasswordForm({
  //       currentPassword: "",
  //       newPassword: "",
  //       confirmPassword: "",
  //     });
  //     toast({ title: "Password changed" });
  //   },
  //   onError: (error) =>
  //     toast({
  //       title: "Password change failed",
  //       description: error?.message || "Please try again.",
  //       variant: "destructive",
  //     }),
  // });

  // const deleteAccountMutation = useMutation({
  //   mutationFn: async (password: string) =>
  //     apiRequest("DELETE", "/user/account", { password }),
  //   onSuccess: () => {
  //     toast({
  //       title: "Account deleted",
  //       description: "Redirecting…",
  //     });
  //     localStorage.clear();
  //     queryClient.clear();
  //     setTimeout(() => setLocation("/"), 1200);
  //   },
  //   onError: (error) =>
  //     toast({
  //       title: "Account deletion failed",
  //       description: error?.message || "Please try again.",
  //       variant: "destructive",
  //     }),
  // });

  // const handleForgotPassword = () => forgotPasswordMutation.mutate();

  // const handleDeleteAccount = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (deleteAccountForm.confirmText !== "DELETE") {
  //     toast({
  //       title: "Confirmation required",
  //       description: "Please type 'DELETE' to confirm account deletion.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }
  //   deleteAccountMutation.mutate(deleteAccountForm.password);
  // };

  // -------- UI --------
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-700 bg-gray-900">
        <div className="flex items-center justify-center md:justify-between p-4 max-w-4xl mx-auto">
          <h1 className="text-xl font-semibold w-full text-center md:text-left">
            Settings
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* sidebar */}
          <div className="md:col-span-1">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection("profile")}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                  activeSection === "profile"
                    ? "bg-[#f7f7f7] text-[#000000]"
                    : "text-gray-300 hover:text-[#000000] hover:bg-gray-300"
                }`}
              >
                Profile
              </button>
              {/* <button
                onClick={() => setActiveSection("password")}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                  activeSection === "password"
                    ? "bg-[#f7f7f7] text-[#000000]"
                    : "text-gray-300 hover:text-[#000000] hover:bg-gray-300"
                }`}
              >
                Password
              </button>
              <button
                onClick={() => setActiveSection("delete")}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                  activeSection === "delete"
                    ? "bg-red-600 text-white"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
              >
                Delete Account
              </button> */}
            </nav>
          </div>

          {/* content */}
          <div className="md:col-span-3">
            {activeSection === "profile" && (
              <div className="rounded-lg border border-gray-700 p-6 bg-[#111827a1]">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">
                    Profile Information
                  </h2>
                  <p className="text-gray-400">
                    Update your name, username, email, bio, profile picture, and
                    profile tags.
                  </p>
                </div>

                {loadingProfile ? (
                  <div className="py-12 text-center text-white/60">
                    Loading…
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          First Name
                        </label>
                        <input
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm((s) => ({
                              ...s,
                              firstName: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Last Name
                        </label>
                        <input
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm((s) => ({
                              ...s,
                              lastName: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    {/* username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        value={profileForm.username}
                        onChange={(e) =>
                          setProfileForm((s) => ({
                            ...s,
                            username: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
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
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-md text-white opacity-70 cursor-not-allowed"
                        required
                      />
                    </div>

                    {/* bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) =>
                          setProfileForm((s) => ({ ...s, bio: e.target.value }))
                        }
                        rows={4}
                        maxLength={240}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tell people a bit about yourself…"
                      />
                    </div>

                    {/* tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Tags
                      </label>
                      <TagsInput
                        value={profileForm.tags}
                        max={2} // limit to 2
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
                      <p className="text-xs text-white/50 mt-1">Max 2 tags.</p>
                    </div>

                    {/* profile picture */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Picture
                      </label>
                      <div className="flex items-center gap-4">
                        <img
                          src={
                            previewUrl ||
                            "https://placehold.co/96x96/111827/FFFFFF?text=Avatar"
                          }
                          className="h-16 w-16 rounded-full object-cover border border-white/10"
                        />
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFile(e.target.files?.[0] ?? null)
                            }
                          />
                          Choose file…
                        </label>
                        {profilePicFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setProfilePicFile(null);
                              setPreviewUrl(user?.profilePicture || previewUrl);
                            }}
                            className="text-sm text-white/80 hover:text-white underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={saveAllMutation.isPending || !anythingChanged}
                        className="px-6 py-3 bg-[#f7f7f7] hover:bg-gray-300 text-[#000000] font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saveAllMutation.isPending && (
                          <svg
                            className="animate-spin -ml-1 h-4 w-4"
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
                        )}
                        Update Profile
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Password */}
            {/* {activeSection === "password" && (
              <div className="rounded-lg border border-gray-700 p-6 bg-[#111827a1]">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2">
                    Change Password
                  </h2>
                  <p className="text-gray-400">
                    Update your password to keep your account secure.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          newPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      minLength={6}
                      required
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      Password must be at least 6 characters long.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotPasswordMutation.isPending}
                      className="px-4 py-2 text-blue-400 hover:text-blue-300 underline font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {forgotPasswordMutation.isPending && (
                        <svg
                          className="animate-spin -ml-1 h-4 w-4 text-blue-400"
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
                      )}
                      Forgot Password?
                    </button>
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="px-6 py-3 bg-[#f7f7f7] hover:bg-gray-300 text-[#000000] font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {changePasswordMutation.isPending && (
                        <svg
                          className="animate-spin -ml-1 h-4 w-4 text-white"
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
                      )}
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            )} */}

            {/* {activeSection === "delete" && (
              <div className="rounded-lg border border-red-700 p-6 bg-[#111827a1]">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold mb-2 text-red-400">
                    Delete Account
                  </h2>
                  <p className="text-gray-400">
                    Permanently delete your account and all associated data.
                  </p>
                </div>

                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
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
                    <div>
                      <h3 className="text-red-400 font-semibold mb-1">
                        Warning
                      </h3>
                      <p className="text-gray-300 text-sm">
                        This action cannot be undone. All your clubs, messages,
                        and account data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleDeleteAccount} className="space-y-6">
                  <div>
                    <label
                      htmlFor="confirmText"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Type "DELETE" to confirm
                    </label>
                    <input
                      type="text"
                      id="confirmText"
                      value={deleteAccountForm.confirmText}
                      onChange={(e) =>
                        setDeleteAccountForm({
                          ...deleteAccountForm,
                          confirmText: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="DELETE"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="deletePassword"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      id="deletePassword"
                      value={deleteAccountForm.password}
                      onChange={(e) =>
                        setDeleteAccountForm({
                          ...deleteAccountForm,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={deleteAccountMutation.isPending}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {deleteAccountMutation.isPending && (
                        <svg
                          className="animate-spin -ml-1 h-4 w-4 text-white"
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
                      )}
                      Delete Account
                    </button>
                  </div>
                </form>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}
