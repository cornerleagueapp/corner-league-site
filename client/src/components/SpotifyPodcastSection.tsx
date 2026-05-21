import React from "react";

type SpotifyPodcastSectionProps = {
  title?: string;
  subtitle?: string;
  showEmbedUrl: string;
};

export default function SpotifyPodcastSection({
  title,
  subtitle,
  showEmbedUrl,
}: SpotifyPodcastSectionProps) {
  return (
    <section id="podcast-section" className="scroll-mt-24 pt-20">
      <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.96)_0%,rgba(4,10,19,0.98)_100%)] px-4 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:rounded-[38px] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
              Podcast
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Race Talk
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                Latest{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
                  Episodes
                </span>
              </h2>

              {subtitle ? (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.25)] lg:text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                Featured Show
              </div>
              <div className="mt-1 max-w-[220px] truncate text-sm font-black uppercase tracking-[0.08em] text-white">
                {title || "Corner League Podcast"}
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/80 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.34)] sm:p-5">
            {title ? (
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">
                    Now Streaming
                  </div>

                  <h3 className="mt-2 break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-white sm:text-2xl">
                    {title}
                  </h3>
                </div>

                <div className="w-fit rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
                  Spotify
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <iframe
                data-testid="embed-iframe"
                style={{ borderRadius: "18px" }}
                src={showEmbedUrl}
                width="100%"
                height="352"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title={title || "Corner League Podcast"}
                className="block w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
