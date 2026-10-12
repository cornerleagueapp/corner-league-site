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
    <div className="relative min-h-screen overflow-hidden bg-cl-canvas text-cl-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 cl-panel-wash" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-cl-accent/[0.12] blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-cl-accent/[0.12] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 text-center sm:px-6">
        <div className="relative overflow-hidden rounded-[38px] border border-cl-accent/10 cl-panel-wash px-6 py-10 shadow-cl-panel backdrop-blur sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-cl-accent/10 blur-3xl" />
            <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-cl-accent/10 blur-3xl" />
          </div>

          <div className="relative">
            <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-[30px] border border-cl-accent/[0.15] bg-cl-accent/[0.06] shadow-cl-panel sm:h-28 sm:w-28">
              <img
                src={logoPath}
                alt="Corner League Logo"
                className="cl-logo-tile h-16 w-16 object-contain sm:h-20 sm:w-20"
              />
            </div>

            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
              <span className="h-2 w-2 rounded-full bg-cl-accent shadow-cl-panel" />
              Corner League Sports
            </div>

            <h1 className="text-cl-accent text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl">
              Welcome to Corner League
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-cl-muted sm:text-base">
              Loading your racing hub, athlete profiles, results, media, and
              community tools.
            </p>

            <div className="mt-8 overflow-hidden rounded-full border border-cl-accent/10 bg-cl-subtle p-1">
              <div className="h-2 rounded-full cl-panel-wash shadow-cl-panel animate-[progress_2.2s_linear_forwards]" />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cl-muted">
              <span>Scores</span>
              <span className="h-1 w-1 rounded-full bg-cl-subtle" />
              <span>RacePods</span>
              <span className="h-1 w-1 rounded-full bg-cl-subtle" />
              <span>Gallery</span>
              <span className="h-1 w-1 rounded-full bg-cl-subtle" />
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
