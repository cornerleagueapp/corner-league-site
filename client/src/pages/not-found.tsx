// src/pages/not-found.tsx (or wherever your NotFound lives)
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import logoPath from "@assets/CL_Logo.png";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Soft glow background */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-[28rem] w-[28rem] rounded-full bg-purple-500/20 blur-3xl" />

      {/* Return Home (top-left) */}
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6 z-20">
        <Link href="/">
          <a className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </a>
        </Link>
      </div>

      {/* Center content */}
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative">
            <img
              src={logoPath}
              alt="Corner League Logo"
              className="h-20 w-20 md:h-24 md:w-24 object-contain"
            />
            {/* Subtle ring/glow */}
            <div
              className="absolute inset-0 -z-10 rounded-full blur-xl"
              style={{ boxShadow: "0 0 80px 30px rgba(168,85,247,0.15)" }}
            />
          </div>
        </div>

        {/* Neon 404 */}
        <h1
          className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-none tracking-tight"
          style={{
            textShadow:
              "0 0 20px rgba(192,132,252,0.6), 0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(147,51,234,0.35)",
          }}
        >
          <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-violet-500 bg-clip-text text-transparent">
            404
          </span>
        </h1>
        <p className="mt-4 text-lg text-white/70">Page not found.</p>
        <p className="mt-1 text-sm text-white/50">
          The page you’re looking for moved, was removed, or never existed.
        </p>

        {/* Quick actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/clubs">
            <a className="rounded-full bg-white px-5 py-2 text-black hover:bg-gray-200">
              Explore Clubs
            </a>
          </Link>
          <Link href="/auth">
            <a className="rounded-full border border-white/15 bg-white/5 px-5 py-2 hover:bg-white/10">
              Sign In
            </a>
          </Link>
        </div>

        {/* Sitemap */}
        <div className="mt-14 w-full">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 text-xs uppercase tracking-wider text-white/50">
              Site Map
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {/* Why Corner League */}
              <a
                href="https://corner-league.ghost.io/about/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
              >
                Why Corner League
              </a>

              {/* Clubs */}
              <Link href="/clubs">
                <a className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10">
                  Clubs
                </a>
              </Link>

              {/* Insights */}
              <a
                href="https://corner-league.ghost.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
              >
                Insights
              </a>

              {/* Olympic AI */}
              <a
                href="https://www.olympicai.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
              >
                Olympic AI
              </a>

              {/* Contact */}
              <Link href="/contact">
                <a className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10">
                  Contact Us
                </a>
              </Link>

              {/* Terms/Privacy */}
              <Link href="/terms">
                <a className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10">
                  Terms / Privacy
                </a>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient line for flair */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-[90%] -translate-x-1/2 bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
    </div>
  );
}
