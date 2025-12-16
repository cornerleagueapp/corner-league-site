// src/components/LeagueMediaFeatures.tsx
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

import aiLeagueGif from "@/assets/section1.mp4";
import proAnalyticsGif from "@/assets/section2.mp4";
import leagueBrandingGif from "@/assets/section3---Elegant.mp4";
import sportsCommunityGif from "@/assets/section4.mp4";

type FeatureBlock = {
  id: string;
  eyebrow?: string;
  title: string;
  body: string;
  bodySecondary?: string;
  ctaLabel?: string;
  ctaHref?: string;
  mediaSrc: string;
  mediaAlt: string;
  mediaType?: "image" | "video";
};

const featureBlocks: FeatureBlock[] = [
  {
    id: "ai-league-media",
    eyebrow: "INSTANT PRO INSIGHTS",
    title: "AI-Powered League Media",
    body: "Get automatic game recaps, player stat lines, highlights, and league updates the moment your stats are uploaded. Corner League turns any rec league into its own ESPN, delivering pro-style coverage without the work.",
    mediaSrc: aiLeagueGif,
    mediaAlt: "Animated preview of AI-powered league media recaps",
    mediaType: "video",
  },
  {
    id: "pro-analytics",
    eyebrow: "ADVANCED PERFORMANCE INSIGHTS",
    title: "Pro Analytics for Every Player",
    body: "Unlock box scores, player cards, season trends, and matchup insights generated instantly by AI. Whether you're an organizer or a player, Corner League gives you the kind of analytics normally reserved for pro teams — now built for your league.",
    mediaSrc: proAnalyticsGif,
    mediaAlt: "Animated analytics dashboard for every player",
    mediaType: "video",
  },
  {
    id: "league-branding",
    eyebrow: "ULTIMATE LEAGUE CUSTOMIZATION",
    title: "Your League, Your Look",
    body: "Design your league’s digital presence with customizable layouts, player profiles, team pages, and media posts. Add photos, videos, and highlights.",
    mediaSrc: leagueBrandingGif,
    mediaAlt: "Animated examples of customizable league branding",
    mediaType: "video",
  },
  {
    id: "sports-community",
    title: "Build Your Sports Community",
    body: "Create and run leagues or tournaments in minutes, all while climbing local and citywide leaderboards. Connect your league to players, fans, and sponsors and share every update across social platforms with one click.",
    bodySecondary:
      "Corner League isn’t just another platform, it’s a new digital home for every sport, every player, and every community.",
    ctaLabel: "Start a League",
    ctaHref: "/welcome",
    mediaSrc: sportsCommunityGif,
    mediaAlt: "Animated community feed and leaderboards",
    mediaType: "video",
  },
];

export default function LeagueMediaFeatures() {
  return (
    <section className="px-5 bg-black">
      <div className="mx-auto max-w-6xl py-12 md:py-16 lg:py-20 space-y-12 md:space-y-16">
        {featureBlocks.map((block, index) => {
          const isEven = index % 2 === 0;

          const mediaColClasses =
            "lg:col-span-6 order-1 " + (isEven ? "lg:order-1" : "lg:order-2");
          const textColClasses =
            "lg:col-span-6 order-2 " + (isEven ? "lg:order-2" : "lg:order-1");

          return (
            <div
              key={block.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center"
            >
              {/* Media / GIF column */}
              <div className={mediaColClasses}>
                <MediaBlock
                  src={block.mediaSrc}
                  alt={block.mediaAlt}
                  type={block.mediaType}
                />
              </div>

              {/* Text column */}
              <div className={textColClasses}>
                {block.eyebrow && (
                  <p className="text-xs md:text-sm font-semibold tracking-[0.18em] text-white/60 uppercase">
                    {block.eyebrow}
                  </p>
                )}
                <h3 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
                  {block.title}
                </h3>
                <p className="mt-4 text-base md:text-lg text-white/75 leading-relaxed">
                  {block.body}
                </p>
                {block.bodySecondary && (
                  <p className="mt-4 text-base md:text-lg text-white/75 leading-relaxed">
                    {block.bodySecondary}
                  </p>
                )}

                {block.ctaLabel && block.ctaHref && (
                  <div className="mt-6">
                    <Link href={block.ctaHref}>
                      <Button className="rounded-full px-6 py-3 text-sm md:text-base font-semibold bg-white text-black hover:bg-gray-100">
                        {block.ctaLabel}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MediaBlock({
  src,
  alt,
  type = "video",
}: {
  src: string;
  alt: string;
  type?: "image" | "video";
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] shadow-[0_18px_60px_rgba(0,0,0,0.7)]">
      <div className="aspect-[4/3] w-full">
        {type === "video" ? (
          <video
            src={src}
            aria-label={alt}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="none"
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
    </div>
  );
}
