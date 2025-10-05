// src/pages/welcome-splash.tsx
import { useEffect } from "react";
import { useLocation } from "wouter";
import logoPath from "@assets/CL_Logo.png";

export default function WelcomeSplash() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const t = setTimeout(() => {
      // replace so Back doesn't return to splash
      navigate("/scores", { replace: true });
    }, 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* same soft glow bg as NotFound */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-purple-500/20 blur-3xl" />

      {/* Center content (logo + welcome) */}
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-8">
          <div className="relative">
            <img
              src={logoPath}
              alt="Corner League Logo"
              className="h-20 w-20 md:h-24 md:w-24 object-contain"
            />
            <div
              className="absolute inset-0 -z-10 rounded-full blur-xl"
              style={{ boxShadow: "0 0 80px 30px rgba(168,85,247,0.15)" }}
            />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold">
          Welcome to Corner League
        </h1>
        <p className="mt-3 text-white/70">Taking you to your scores…</p>

        {/* Optional 3s progress bar */}
        <div className="mt-8 w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-fuchsia-400 to-violet-500 animate-[progress_2s_linear_forwards]" />
        </div>
      </div>

      <style>{`
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  );
}
