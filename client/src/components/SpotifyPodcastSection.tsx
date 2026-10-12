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
      <div className="relative overflow-hidden rounded-[30px] border border-cl-accent/10 cl-panel-wash px-4 py-8 shadow-cl-panel sm:rounded-[38px] sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-cl-accent/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>

        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-cl-accent shadow-cl-panel" />
              Podcast
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Race Talk
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-cl-ink min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                Latest <span className="cl-title-accent">Episodes</span>
              </h2>

              {subtitle ? (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-cl-border bg-cl-subtle px-5 py-4 text-left shadow-cl-panel lg:text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cl-muted">
                Featured Show
              </div>
              <div className="mt-1 max-w-[220px] truncate text-sm font-black uppercase tracking-[0.08em] text-cl-ink">
                {title || "Corner League Podcast"}
              </div>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-[30px] border border-cl-accent/10 bg-cl-surface p-3 shadow-cl-panel sm:p-5">
            {title ? (
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                    Now Streaming
                  </div>

                  <h3 className="mt-2 break-words text-xl font-black uppercase leading-tight tracking-[-0.02em] text-cl-ink sm:text-2xl">
                    {title}
                  </h3>
                </div>

                <div className="w-fit rounded-full border border-cl-accent/20 bg-cl-accent/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent">
                  Spotify
                </div>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-[24px] border border-cl-border bg-cl-subtle shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
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
