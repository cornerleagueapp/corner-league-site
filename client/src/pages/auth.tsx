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

const authInputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4 text-sm text-white outline-none placeholder:text-white/40 transition focus:border-cyan-300/35 focus:bg-cyan-300/[0.06] focus:ring-2 focus:ring-cyan-300/10";

const authPrimaryButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40";

const authSecondaryButtonClass =
  "rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white";

const authChipClass = (active: boolean, tone: "cyan" | "orange" = "cyan") =>
  `rounded-full border px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition ${
    active
      ? tone === "orange"
        ? "border-[#FF6B35]/30 bg-[#FF6B35] text-white"
        : "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
      : tone === "orange"
        ? "border-white/10 bg-white/[0.05] text-white/65 hover:border-[#FF6B35]/25 hover:bg-[#FF6B35]/10 hover:text-white"
        : "border-white/10 bg-white/[0.05] text-white/65 hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
  }`;

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
        payload,
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
    v: string,
  ) =>
    setList((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  const toggleSport = (s: string) => {
    setSportsError("");
    toggleFromList(setSelectedSports, s);
  };
  const toggleTag = (t: string) => {
    setTagsError("");
    setSelectedTags((p) =>
      p.includes(t) ? p.filter((x) => x !== t) : p.length >= 2 ? p : [...p, t],
    );
  };

  const checkUsernameAvailability = async () => {
    const username = registerData.username.trim().toLowerCase();
    if (!username) return (setUsernameError("Username is required"), false);
    if (!usernameRegex.test(username))
      return (
        setUsernameError("Only letters, numbers, and underscores are allowed."),
        false
      );
    try {
      const res = await apiFetch(
        `/users/check-username/${encodeURIComponent(username)}`,
        { method: "GET", skipAuth: true },
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
    if (!email) return (setEmailError("Email is required"), false);
    if (!emailRegex.test(email))
      return (setEmailError("Invalid email format."), false);
    try {
      const res = await apiFetch(
        `/users/check-email/${encodeURIComponent(email)}`,
        { method: "GET", skipAuth: true },
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
        : "",
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
        },
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
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#030913] p-3 text-white sm:p-6">
      <PageSEO title="Sign in" canonicalPath="/auth" noindex />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.08),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-[34px] border border-cyan-300/10 bg-[#07111F]/85 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] backdrop-blur sm:p-7">
        {authMethod === "welcome" ? (
          /* Welcome Screen */
          <>
            {/* Back Arrow */}
            <div className="mb-5">
              <button
                onClick={() => setLocation("/")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/65 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
                aria-label="Back to home"
              >
                <FaArrowLeft size={16} />
              </button>
            </div>

            {/* Logo */}
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.06] shadow-[0_0_38px_rgba(34,211,238,0.12)]">
                <img
                  src={logoPath}
                  alt="Corner League Logo"
                  className="h-12 w-12 object-contain"
                />
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">
                Corner League Sports
              </div>

              <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] text-white">
                Welcome
              </h1>

              <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-slate-300">
                Sign in to follow racers, claim profiles, manage clubs, and
                access the Corner League racing platform.
              </p>
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
              <div className="mt-8">
                <button
                  onClick={() => setAuthMethod("email")}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-cyan-300 px-6 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] transition hover:bg-cyan-200"
                >
                  <FaEnvelope size={16} />
                  Continue With Email
                </button>
              </div>
            </div>

            {/* Terms */}
            <p className="mt-6 px-4 text-center text-xs leading-6 text-white/45">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </>
        ) : authMethod === "email" ? (
          /* Email Auth Form */
          <>
            {/* Back Button */}
            <div className="mb-5">
              <button
                onClick={() => setAuthMethod("welcome")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/65 transition hover:border-cyan-300/25 hover:bg-cyan-300/10 hover:text-white"
                aria-label="Back to welcome"
              >
                <FaArrowLeft size={16} />
              </button>
            </div>

            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[24px] border border-cyan-300/15 bg-cyan-300/[0.06]">
                <img
                  src={logoPath}
                  alt="Corner League Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>

              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/70">
                Corner League Sports
              </div>

              <h1 className="mt-3 text-3xl font-black uppercase tracking-[-0.03em] text-white">
                {isLogin ? "Sign In" : "Create Account"}
              </h1>

              <p className="mt-3 text-sm leading-7 text-slate-300">
                {isLogin
                  ? "Sign in to access clubs, racer profiles, and Corner League tools."
                  : "Create your account to follow the sport, claim profiles, and join the platform."}
              </p>

              {!isLogin && (
                <p className="mt-3 text-xs leading-6 text-white/45">
                  This login works for{" "}
                  <span className="font-semibold text-white/70">
                    Olympic AI
                  </span>{" "}
                  and the
                  <span className="font-semibold text-white/70">
                    {" "}
                    Corner League Mobile App
                  </span>
                  .
                </p>
              )}
            </div>

            {/* Auth Toggle */}
            <div className="mb-8 grid grid-cols-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
                  isLogin
                    ? "bg-cyan-300 text-[#06111d] shadow-[0_0_22px_rgba(34,211,238,0.2)]"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.16em] transition ${
                  !isLogin
                    ? "bg-cyan-300 text-[#06111d] shadow-[0_0_22px_rgba(34,211,238,0.2)]"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Form */}
            <div className="space-y-6">
              {isLogin ? (
                /* Login Form */
                <form onSubmit={handleLogin} className="space-y-5">
                  <input
                    type="text"
                    value={loginData.identifier}
                    onChange={(e) =>
                      setLoginData({
                        ...loginData,
                        identifier: e.target.value,
                      })
                    }
                    className={authInputClass}
                    placeholder="Email or username"
                    required
                  />

                  <input
                    type="password"
                    minLength={6}
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    className={authInputClass}
                    placeholder="Password"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className={authPrimaryButtonClass}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </button>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setShowForgot((v) => !v)}
                      className="text-xs font-bold uppercase tracking-[0.14em] text-white/45 underline-offset-4 hover:text-cyan-200 hover:underline"
                    >
                      {showForgot ? "Hide Reset" : "Forgot Password?"}
                    </button>
                  </div>

                  {showForgot && (
                    <div className="rounded-[24px] border border-cyan-300/10 bg-black/25 p-4">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your account email"
                        className={authInputClass}
                      />

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
                                description: e?.message ?? "Please try again.",
                                variant: "destructive",
                              });
                            } finally {
                              setSendingReset(false);
                            }
                          }}
                          className={authPrimaryButtonClass}
                        >
                          {sendingReset ? "Sending..." : "Send Link"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowForgot(false)}
                          className={authSecondaryButtonClass}
                        >
                          Cancel
                        </button>
                      </div>

                      <p className="mt-3 text-xs leading-6 text-white/45">
                        We’ll send a secure link from Firebase to reset your
                        password.
                      </p>
                    </div>
                  )}
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className={authInputClass}>
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
                    <p className="mb-1 text-xs text-red-300">{usernameError}</p>
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
                    className={`${authInputClass} ${
                      usernameError
                        ? "border-red-400/50 focus:border-red-400/60"
                        : ""
                    }`}
                    placeholder="Choose a username"
                    required
                  />

                  {emailError && (
                    <p className="mb-1 text-xs text-red-300">{emailError}</p>
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
                    className={`${authInputClass} ${
                      emailError
                        ? "border-red-400/50 focus:border-red-400/60"
                        : ""
                    }`}
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
                            className={authChipClass(
                              selectedSports.includes(s),
                              "cyan",
                            )}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                    {sportsError && (
                      <p className="mb-1 text-xs text-red-300">{sportsError}</p>
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
                            className={authChipClass(
                              selectedTags.includes(t),
                              "orange",
                            )}
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
                      <p className="mb-1 text-xs text-red-300">{tagsError}</p>
                    )}
                  </div>

                  {passwordError && (
                    <p className="mb-1 text-xs text-red-300">{passwordError}</p>
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
                    disabled={!canSubmit || registerMutation.isPending}
                    className={authPrimaryButtonClass}
                  >
                    {registerMutation.isPending
                      ? "Creating Account..."
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
