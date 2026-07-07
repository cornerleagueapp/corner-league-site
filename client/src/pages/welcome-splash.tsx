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
    }, 2200);

    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030913] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,107,53,0.12),transparent_28%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-cyan-300/12 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-[#FF6B35]/12 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 text-center sm:px-6">
        <div className="relative overflow-hidden rounded-[38px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.92)_0%,rgba(4,10,19,0.96)_100%)] px-6 py-10 shadow-[0_34px_100px_rgba(0,0,0,0.48)] backdrop-blur sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          </div>

          <div className="relative">
            <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-[30px] border border-cyan-300/15 bg-cyan-300/[0.06] shadow-[0_0_44px_rgba(34,211,238,0.16)] sm:h-28 sm:w-28">
              <img
                src={logoPath}
                alt="Corner League Logo"
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
              />
            </div>

            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
              Corner League Sports
            </div>

            <h1 className="bg-[linear-gradient(90deg,#FFFFFF_0%,#7CF4FF_48%,#FF7849_100%)] bg-clip-text text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-transparent sm:text-5xl">
              Welcome to Corner League
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-slate-300 sm:text-base">
              Loading your racing hub, athlete profiles, results, media, and
              community tools.
            </p>

            <div className="mt-8 overflow-hidden rounded-full border border-cyan-300/10 bg-white/[0.06] p-1">
              <div className="h-2 rounded-full bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_45%,#FF7849_100%)] shadow-[0_0_24px_rgba(34,211,238,0.28)] animate-[progress_2.2s_linear_forwards]" />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
              <span>Scores</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>RacePods</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>Gallery</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span>Racers</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
