// src/pages/AuthPage.tsx
import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PageSEO } from "@/seo/usePageSEO";
import { useAuth } from "@/hooks/useAuth";
import {
  apiRequest,
  apiFetch,
  scheduleProactiveRefresh,
} from "@/lib/apiClient";
import { setTokens, setUsername, saveUser } from "@/lib/token";
import { User } from "@/types/user";
import { FaApple, FaGoogle, FaEnvelope, FaArrowLeft } from "react-icons/fa";
import logoPath from "@assets/CL_Logo.png";

type AuthSuccess = { accessToken: string; refreshToken?: string; user: User };
type LoginResponse = {
  data?: { accessToken?: string; refreshToken?: string; user?: User };
  accessToken?: string;
  refreshToken?: string;
  user?: User;
};

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [authMethod, setAuthMethod] = useState<
    "welcome" | "email" | "apple" | "google"
  >("welcome");
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [loginData, setLoginData] = useState({ identifier: "", password: "" });
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as string;

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  async function sendPasswordReset(email: string) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg =
        j?.error?.message?.replace(/_/g, " ").toLowerCase() ||
        "Failed to send reset email";
      throw new Error(msg);
    }
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const next =
      new URLSearchParams(window.location.search).get("next") || "/clubs";
    setLocation(next, { replace: true });
  }, [isAuthenticated, setLocation]);

  const loginMutation = useMutation<AuthSuccess, Error, typeof loginData>({
    mutationFn: async (credentials) => {
      const isEmail = credentials.identifier.includes("@");
      const payload = isEmail
        ? {
            email: credentials.identifier.trim(),
            password: credentials.password,
          }
        : {
            username: credentials.identifier.trim().toLowerCase(),
            password: credentials.password,
          };

      // Your API issues JWTs here
      const json = await apiRequest<LoginResponse>(
        "POST",
        "/auth/sign-in",
        payload
      );
      const data = json.data ?? json;
      const accessToken = data?.accessToken;
      const refreshToken = data?.refreshToken;
      const user = data?.user;

      if (!accessToken || !user) throw new Error("Invalid login response");
      return { accessToken, refreshToken, user } as AuthSuccess;
    },
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setTokens(accessToken, refreshToken);
      if (refreshToken) scheduleProactiveRefresh(accessToken);
      if (user?.username) setUsername(user.username);
      saveUser(user);
      queryClient.setQueryData(["/auth/me"], user);

      toast({
        title: "Welcome back!",
        description: `Hello ${user.firstName ?? user.username}!`,
      });
      const next =
        new URLSearchParams(window.location.search).get("next") || "/clubs";
      setLocation(next, { replace: true });
    },
    onError: (err: any) => {
      toast({
        title: "Sign-in failed",
        description:
          err?.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // --- Registration (kept from your version, still backend-only) ---
  const usernameRegex = /^[a-z0-9_]+$/;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const SPORTS = [
    "MLS",
    "NBA",
    "NFL",
    "MLB",
    "NHL",
    "Jet-Ski",
    "Tennis",
    "Golf",
    "Cricket",
    "Rugby",
    "MMA",
    "Boxing",
  ];
  const PROFILE_TAGS = [
    "Player",
    "Coach",
    "Fan",
    "Organizer",
    "Referee",
    "Parent",
  ];
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sportsError, setSportsError] = useState("");
  const [tagsError, setTagsError] = useState("");

  const toggleFromList = (
    setList: Dispatch<SetStateAction<string[]>>,
    v: string
  ) =>
    setList((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  const toggleSport = (s: string) => {
    setSportsError("");
    toggleFromList(setSelectedSports, s);
  };
  const toggleTag = (t: string) => {
    setTagsError("");
    setSelectedTags((p) =>
      p.includes(t) ? p.filter((x) => x !== t) : p.length >= 2 ? p : [...p, t]
    );
  };

  const checkUsernameAvailability = async () => {
    const username = registerData.username.trim().toLowerCase();
    if (!username) return setUsernameError("Username is required"), false;
    if (!usernameRegex.test(username))
      return (
        setUsernameError("Only letters, numbers, and underscores are allowed."),
        false
      );
    try {
      const res = await apiFetch(
        `/users/check-username/${encodeURIComponent(username)}`,
        { method: "GET", skipAuth: true }
      );
      const json = await res.json();
      const taken = !!json?.exists;
      setUsernameError(taken ? "Username is already taken" : "");
      return !taken;
    } catch {
      setUsernameError("Could not verify username, try again later.");
      return false;
    }
  };

  const checkEmailAvailability = async () => {
    const email = registerData.email.trim();
    if (!email) return setEmailError("Email is required"), false;
    if (!emailRegex.test(email))
      return setEmailError("Invalid email format."), false;
    try {
      const res = await apiFetch(
        `/users/check-email/${encodeURIComponent(email)}`,
        { method: "GET", skipAuth: true }
      );
      const json = await res.json();
      const taken = !!json?.exists;
      setEmailError(taken ? "Email is already in use" : "");
      return !taken;
    } catch {
      setEmailError("Could not verify email, try again later.");
      return false;
    }
  };

  const validatePassword = () =>
    setPasswordError(
      !registerData.password || registerData.password.length < 6
        ? "Password must be at least 6 characters"
        : ""
    );

  const passwordsMatch =
    registerData.confirmPassword.length === 0 ||
    registerData.password === registerData.confirmPassword;

  const canSubmit =
    !!(
      registerData.firstName &&
      registerData.lastName &&
      registerData.username &&
      registerData.email &&
      registerData.password &&
      selectedSports.length >= 1 &&
      selectedTags.length >= 1 &&
      selectedTags.length <= 2 &&
      !usernameError &&
      !emailError &&
      !passwordError
    ) && passwordsMatch;

  const registerMutation = useMutation<
    AuthSuccess,
    any,
    Omit<typeof registerData, "confirmPassword">
  >({
    mutationFn: async (form) => {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        username: form.username.trim().toLowerCase(),
        tags: { profile: selectedTags.map((t) => t.trim()).filter(Boolean) },
        sportInterests: selectedSports.map((s) => s.trim()).filter(Boolean),
      };

      await apiRequest("POST", "/auth/sign-up", payload);
      const loginJson = await apiRequest<LoginResponse>(
        "POST",
        "/auth/sign-in",
        {
          email: form.email.trim(),
          password: form.password,
        }
      );
      const data = loginJson.data ?? loginJson;
      const accessToken = data?.accessToken;
      const refreshToken = data?.refreshToken;
      const user = data?.user;
      if (!accessToken || !user)
        throw new Error("Invalid login response after sign-up");
      return { accessToken, refreshToken, user } as AuthSuccess;
    },
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setTokens(accessToken, refreshToken);
      if (refreshToken) scheduleProactiveRefresh(accessToken);
      if (user?.username) setUsername(user.username);
      saveUser(user);
      queryClient.setQueryData(["/auth/me"], user);

      toast({
        title: "Welcome to Corner League!",
        description: `Account created for ${user.firstName ?? user.username}!`,
      });
      const next =
        new URLSearchParams(window.location.search).get("next") || "/clubs";
      setLocation(next, { replace: true });
    },
    onError: (err: any) => {
      const msg = err?.body?.message || err?.message || "Please try again.";
      console.error("Sign-up failed:", {
        status: err?.status,
        body: err?.body,
      });
      toast({
        title: "Registration failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleAppleLogin = () => {
    toast({
      title: "Apple Sign In",
      description: "Apple Sign In is not yet implemented",
      variant: "destructive",
    });
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google Sign In",
      description: "Google Sign In is not yet implemented",
      variant: "destructive",
    });
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }
    if (selectedSports.length < 1) {
      setSportsError("Please select at least one sport.");
      return;
    }
    if (selectedTags.length < 1) {
      setTagsError("Please select at least one profile tag.");
      return;
    }
    if (selectedTags.length > 2) {
      toast({
        title: "Too many tags",
        description: "Choose at most two profile tags.",
        variant: "destructive",
      });
      return;
    }
    const [okUser, okEmail] = await Promise.all([
      checkUsernameAvailability(),
      checkEmailAvailability(),
    ]);
    if (!okUser || !okEmail) return;
    const { confirmPassword, ...payload } = registerData;
    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <PageSEO title="Sign in" canonicalPath="/auth" noindex />
      <div className="w-full max-w-md">
        {authMethod === "welcome" ? (
          /* Welcome Screen */
          <>
            {/* Back Arrow */}
            <div className="absolute top-6 left-6">
              <button
                onClick={() => setLocation("/")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaArrowLeft size={24} />
              </button>
            </div>

            {/* Logo */}
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <img
                  src={logoPath}
                  alt="Corner League Logo"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h1 className="text-4xl font-light mb-4">Welcome</h1>
            </div>

            {/* Auth Options */}
            <div className="flex justify-center items-center gap-8 mb-16">
              {/* Apple */}
              {/* <button
                onClick={handleAppleLogin}
                className="w-20 h-20 rounded-full border border-gray-600 hover:border-gray-400 transition-colors duration-300 flex items-center justify-center group"
              >
                <FaApple
                  size={28}
                  className="text-gray-400 group-hover:text-white transition-colors"
                />
              </button> */}

              {/* Google */}
              {/* <button
                onClick={handleGoogleLogin}
                className="w-20 h-20 rounded-full border border-gray-600 hover:border-gray-400 transition-colors duration-300 flex items-center justify-center group"
              >
                <FaGoogle
                  size={24}
                  className="text-gray-400 group-hover:text-white transition-colors"
                />
              </button> */}

              {/* Email */}
              <button
                onClick={() => setAuthMethod("email")}
                className="w-20 h-20 rounded-full border border-gray-600 hover:border-gray-400 transition-colors duration-300 flex items-center justify-center group"
              >
                <FaEnvelope
                  size={24}
                  className="text-gray-400 group-hover:text-white transition-colors"
                />
              </button>
            </div>

            {/* Terms */}
            <p className="text-center text-sm text-gray-500 px-8 leading-relaxed">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </>
        ) : authMethod === "email" ? (
          /* Email Auth Form */
          <>
            {/* Back Button */}
            <div className="absolute top-6 left-6">
              <button
                onClick={() => setAuthMethod("welcome")}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FaArrowLeft size={24} />
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light mb-4">
                {isLogin ? "Sign In" : "Create Account"}
              </h1>
              <p className="text-gray-400">
                {isLogin
                  ? "Sign in to access clubs and connect with other fans"
                  : "Create your account to get started"}
              </p>

              {!isLogin && (
                <p className="mt-3 text-sm text-gray-400">
                  This login works for{" "}
                  <span className="font-medium">Olympic AI</span> and the
                  <span className="font-medium"> Corner League Mobile App</span>
                  .
                </p>
              )}
            </div>

            {/* Auth Toggle */}
            <div className="flex mb-8 bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-md transition-colors ${
                  isLogin
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-md transition-colors ${
                  !isLogin
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Form */}
            <div className="space-y-6">
              {isLogin ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <input
                      type="text"
                      value={loginData.identifier}
                      onChange={(e) =>
                        setLoginData({
                          ...loginData,
                          identifier: e.target.value,
                        })
                      }
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Email"
                      required
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      minLength={6}
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full px-6 py-4 bg-white text-black font-medium rounded-lg hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
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
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                  <form onSubmit={handleLogin} className="space-y-6">
                    {/* identifier + password inputs (unchanged) */}

                    {/* Forgot link */}
                    <div className="flex items-center justify-between -mt-2">
                      <button
                        type="button"
                        onClick={() => setShowForgot((v) => !v)}
                        className="text-sm text-gray-400 hover:text-white underline"
                      >
                        {showForgot ? "Hide reset" : "Forgot password?"}
                      </button>
                    </div>

                    {/* Inline reset panel */}
                    {showForgot && (
                      <div className="mt-2 rounded-lg border border-gray-800 bg-gray-900 p-3 space-y-3">
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="Enter your account email"
                          className="w-full px-3 py-3 bg-gray-950 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={
                              sendingReset || !emailRegex.test(forgotEmail)
                            }
                            onClick={async () => {
                              try {
                                setSendingReset(true);
                                await sendPasswordReset(forgotEmail.trim());
                                setShowForgot(false);
                                setForgotEmail("");
                                toast({
                                  title: "Email sent",
                                  description:
                                    "Check your inbox for the password reset link (and spam folder just in case).",
                                });
                              } catch (e: any) {
                                toast({
                                  title: "Couldn’t send reset email",
                                  description:
                                    e?.message ?? "Please try again.",
                                  variant: "destructive",
                                });
                              } finally {
                                setSendingReset(false);
                              }
                            }}
                            className="px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-white disabled:cursor-not-allowed"
                          >
                            {sendingReset ? "Sending…" : "Send reset link"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowForgot(false)}
                            className="px-4 py-2 rounded-md bg-transparent border border-white/20 hover:bg-white/10"
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          We’ll send a secure link from Firebase to reset your
                          password.
                        </p>
                      </div>
                    )}
                  </form>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={registerData.firstName}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          firstName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="First name"
                      required
                    />
                    <input
                      type="text"
                      value={registerData.lastName}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-4 py-4 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                      placeholder="Last name"
                      required
                    />
                  </div>

                  {usernameError && (
                    <p className="text-red-500 text-xs mb-1">{usernameError}</p>
                  )}
                  <input
                    type="text"
                    value={registerData.username}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        username: e.target.value.toLowerCase(),
                      })
                    }
                    onBlur={checkUsernameAvailability}
                    className={`w-full px-4 py-4 bg-gray-900 border rounded-lg ${
                      usernameError ? "border-red-500" : "border-gray-700"
                    } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent`}
                    placeholder="Choose a username"
                    required
                  />

                  {emailError && (
                    <p className="text-red-500 text-xs mb-1">{emailError}</p>
                  )}
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        email: e.target.value,
                      })
                    }
                    onBlur={checkEmailAvailability}
                    className={`w-full px-4 py-4 bg-gray-900 border rounded-lg ${
                      emailError ? "border-red-500" : "border-gray-700"
                    } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent`}
                    placeholder="Enter your email"
                    required
                  />

                  {/* SPORTS (>=1) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Select your sports (at least one)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SPORTS.map((s) => {
                        const selected = selectedSports.includes(s);
                        return (
                          <button
                            type="button"
                            key={s}
                            aria-pressed={selected}
                            onClick={() => toggleSport(s)}
                            className={`px-3 py-2 rounded-full border text-sm transition
                            ${
                              selected
                                ? "bg-white text-black border-white"
                                : "bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500"
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    {sportsError && (
                      <p className="text-red-500 text-xs mt-2">{sportsError}</p>
                    )}
                  </div>

                  {/* TAGS (optional, up to 2) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Profile tags (choose 1–2)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROFILE_TAGS.map((t) => {
                        const selected = selectedTags.includes(t);
                        const capReached =
                          !selected && selectedTags.length >= 2;
                        return (
                          <button
                            type="button"
                            key={t}
                            aria-pressed={selected}
                            onClick={() => !capReached && toggleTag(t)}
                            className={`px-3 py-2 rounded-full border text-sm transition
                            ${
                              selected
                                ? "bg-white text-black border-white"
                                : "bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500"
                            }
                            ${
                              capReached ? "opacity-40 cursor-not-allowed" : ""
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {selectedTags.length}/2 selected
                    </p>
                    {tagsError && (
                      <p className="text-red-500 text-xs mt-2">{tagsError}</p>
                    )}
                  </div>

                  {passwordError && (
                    <p className="text-red-500 text-xs mb-1">{passwordError}</p>
                  )}
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        password: e.target.value,
                      })
                    }
                    onBlur={validatePassword}
                    className={`w-full px-4 py-4 bg-gray-900 border rounded-lg ${
                      passwordError ? "border-red-500" : "border-gray-700"
                    } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent`}
                    placeholder="Create a password"
                    required
                  />

                  {!passwordsMatch &&
                    registerData.confirmPassword.length > 0 && (
                      <p className="text-red-500 text-xs mb-1">
                        Passwords do not match.
                      </p>
                    )}
                  <input
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-4 bg-gray-900 border rounded-lg ${
                      !passwordsMatch && registerData.confirmPassword
                        ? "border-red-500"
                        : "border-gray-700"
                    } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent`}
                    placeholder="Confirm your password"
                    required
                  />

                  <button
                    type="submit"
                    disabled={registerMutation.isPending || !canSubmit}
                    className="w-full px-6 py-4 bg-white text-black font-medium rounded-lg
                      hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed
                      transition-colors flex items-center justify-center gap-2"
                  >
                    {registerMutation.isPending
                      ? "Creating account..."
                      : "Create Account"}
                  </button>
                </form>
              )}

              {/* Terms */}
              <p className="text-center text-xs text-gray-500 mt-8">
                By {isLogin ? "signing in" : "creating an account"}, you agree
                to our Terms and Privacy Policy.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
