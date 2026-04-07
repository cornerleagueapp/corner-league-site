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
    <section className="mt-20">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.28em] text-white/40">
          Podcast
        </p>
        <h2 className="mt-2 text-4xl font-black uppercase sm:text-5xl">
          Latest{" "}
          <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">Episodes</span>
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
          {subtitle}
        </p>
      </div>

      <div className="rounded-[28px] border border-cyan-400/10 bg-[linear-gradient(180deg,rgba(7,22,33,0.96)_0%,rgba(4,12,18,0.99)_100%)] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.32)] sm:p-6">
        <div className="mb-4 text-lg font-semibold text-white">{title}</div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <iframe
            data-testid="embed-iframe"
            style={{ borderRadius: "12px" }}
            src={showEmbedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Corner League Podcast"
            className="block w-full"
          />
        </div>
      </div>
    </section>
  );
}
