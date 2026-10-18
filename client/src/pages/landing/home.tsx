import { useState } from "react";
import { DeferredPromoVideo } from "@/components/media/DeferredPromoVideo";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/lib/logout";
import PublicTopNav from "@/components/navigation/PublicTopNav";
import { PageSEO } from "@/seo/usePageSEO";
import { useLocation } from "wouter";

import LeagueMediaFeatures from "@/components/LeagueMediaFeatures";
import image13 from "@/assets/jetski4.jpeg";

import partner1 from "@/assets/fubo.png";
import partner2 from "@/assets/ibm.png";
import partner3 from "@/assets/fanatics.png";
import partner4 from "@/assets/google.png";
import partner5 from "@/assets/peloton.png";
import partner6 from "@/assets/ufc.png";
import partnerPromo from "../../assets/jetSkiBanner.mp4";

const sportsImages = [
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/1.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/11.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/12.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/13.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/14.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/15.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/18.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/19.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/20.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/21.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/22.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/23.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/24.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/25.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/26.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/27.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/28.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/29.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/3.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/30.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/31.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/33.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/34.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/35.webp",
  "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/36.webp",
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [motionPaused, setMotionPaused] = useState(false);

  const handleLogin = () => {
    window.location.href = `/auth?next=${encodeURIComponent(location)}`;
  };
  const handleLogout = async () => {
    await logout("/auth");
  };

  return (
    <div className={`consumer-document-page bg-cl-canvas text-cl-ink font-sans overflow-x-hidden relative ${motionPaused ? "home-motion-paused" : ""}`}>
      <PublicTopNav activeTab="home" />

      <PageSEO
        title="Home"
        description="Discover public clubs or manage your own on Corner League. Join live communities for your favorite teams."
        canonicalPath="/"
        image="https://cornerleague.com/og/clubs.png"
      />

      <div className="consumer-page-frame consumer-marketing-pilot">
      {/* mobile col widths for background collage */}
      <style>{`
        @media (max-width: 767px) {
          .bg-column-0 { left: 0% !important; width: 33.33% !important; }
          .bg-column-1 { left: 33.33% !important; width: 33.33% !important; }
          .bg-column-2 { left: 66.66% !important; width: 33.33% !important; }
        }
      `}</style>

      <style>{`
        .logo-carousel {
          --gap: 2rem;
          --speed: 20s; /* faster than your 28s */
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }
        .logo-viewport { overflow: hidden; }
        .logo-track {
          display: flex;
          align-items: center;
          width: max-content;      
          will-change: transform;
          animation: marquee var(--speed) linear infinite;
        }
        .logo-group {
          display: flex;
          align-items: center;
          gap: var(--gap);
          flex: 0 0 auto;              
        }
        .logo-group--first { padding-right: var(--gap); }

        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); } 
        }
        .logo-carousel:hover .logo-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .logo-track { animation: none; }
        }
      `}</style>

      {/* Background collage */}
      <div className="background-scrolling" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, colIndex) => {
          const columnImages = sportsImages.filter(
            (_, i) => i % 5 === colIndex,
          );

          const duplicatedImages = [
            ...columnImages,
            ...columnImages,
            ...columnImages,
            ...columnImages,
          ];

          const isEvenColumn = colIndex % 2 === 0;
          const animationDuration = 80 + colIndex * 10;
          const animationDelay = colIndex * -8;

          return (
            <div
              key={colIndex}
              className="background-column"
              style={{
                animation: `${
                  isEvenColumn ? "scrollUpEven" : "scrollUpOdd"
                } ${animationDuration}s linear infinite`,
                animationDelay: `${animationDelay}s`,
              }}
            >
              {duplicatedImages.map((src, imgIndex) => {
                const baseHeight = 600;
                const heightVariation = (imgIndex % 3) * 40;
                const imageHeight = baseHeight + heightVariation;

                return (
                  <div
                    key={`col-${colIndex}-${imgIndex}`}
                    className="relative bg-cl-subtle backdrop-blur-sm rounded-lg overflow-hidden shadow-xl"
                    style={{
                      maxHeight: `${imageHeight}px`,
                      minHeight: "200px",
                    }}
                  >
                    <img
                      src={src}
                      alt={`Sports artwork ${
                        (imgIndex % columnImages.length) + 1
                      }`}
                      className="w-full h-full object-cover"
                      loading={imgIndex === 0 ? "eager" : "lazy"}
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                  </div>
                );
              })}
            </div>
          );
        })}

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none z-10" />
      </div>

      <button type="button" aria-pressed={motionPaused} onClick={() => setMotionPaused((value) => !value)}
        className="relative z-20 m-3 min-h-11 rounded-full bg-black/85 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
        {motionPaused ? "Resume background animation" : "Pause background animation"}
      </button>

      {/* HERO */}
      <div className="cl-dark text-cl-ink hero-overlay relative z-10 min-h-screen flex flex-col">
        {/* Center hero text */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6 tracking-tight">
              Where Every Player Feels{" "}
              <span className="italic text-cl-accent ">PRO</span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-cl-muted mb-12 max-w-2xl mx-auto leading-relaxed">
              Corner League is the next-gen sports media platform that turns
              every rec and youth league into its own ESPN.
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-cl-muted mb-12 max-w-2xl mx-auto leading-relaxed">
              Using AI to provide players their pro-style stats, game recaps,
              highlights, and leaderboards that make every game feel
              unforgettable and legendary!
            </p>
            {isAuthenticated && (
              <p className="text-lg md:text-xl text-cl-muted mb-8 text-center">
                Welcome, {user?.firstName ?? user?.email}!
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <div className="flex md:hidden flex-col sm:flex-row gap-4 items-center">
                  <Link href="/welcome">
                    <Button
                      size="lg"
                      className="px-8 py-4 text-lg font-semibold text-cl-ink bg-cl-surface hover:bg-cl-subtle rounded-full"
                    >
                      My Scores
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    className="px-8 py-4 text-lg font-semibold text-cl-ink border-cl-border bg-transparent hover:bg-cl-subtle rounded-full"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogin}
                    className="px-8 py-4 text-lg font-semibold text-cl-ink border-cl-border hover:bg-cl-subtle rounded-full"
                  >
                    Log in
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleLogin}
                    className="px-8 py-4 text-lg font-semibold text-cl-ink bg-cl-surface hover:bg-cl-subtle rounded-full"
                  >
                    Join
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Partner logo slider (pure CSS marquee) */}
      <section className="px-5 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="cl-dark logo-carousel rounded-xl bg-cl-canvas border border-cl-border py-5">
            <div className="logo-viewport">
              <div className="logo-track">
                {/* Group 1 */}
                <div className="logo-group logo-group--first">
                  <ul className="flex items-center gap-[var(--gap)]">
                    {/* your 6 logos */}
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner1}
                        alt="Fubo TV"
                        className="w-24 md:w-28 object-contain opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner2}
                        alt="IBM"
                        className="w-24 md:w-28 object-contain opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner4}
                        alt="Google Cloud"
                        className="w-24 md:w-28 object-contain opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner3}
                        alt="Fanatics"
                        className="w-24 md:w-28 object-contain opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner5}
                        alt="Peloton"
                        className="w-24 md:w-28 object-contain opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner6}
                        alt="UFC"
                        className="w-24 md:w-28 object-contain opacity-80 hover:opacity-100 transition-opacity"
                      />
                    </li>
                  </ul>
                </div>

                {/* Group 2 (duplicate; aria-hidden so screen readers don't read twice) */}
                <div className="logo-group" aria-hidden="true">
                  <ul className="flex items-center gap-[var(--gap)]">
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner1}
                        alt=""
                        className="w-24 md:w-28 object-contain opacity-80"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner2}
                        alt=""
                        className="w-24 md:w-28 object-contain opacity-80"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner4}
                        alt=""
                        className="w-24 md:w-28 object-contain opacity-80"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner3}
                        alt=""
                        className="w-24 md:w-28 object-contain opacity-80"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner5}
                        alt=""
                        className="w-24 md:w-28 object-contain opacity-80"
                      />
                    </li>
                    <li className="w-24 md:w-28 h-12 flex items-center justify-center">
                      <img
                        src={partner6}
                        alt=""
                        className="w-24 md:w-28 object-contain opacity-80"
                      />
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10">
        {/* IJSBA Partner highlight – two-column with video */}
        <Section className="bg-gradient-to-b from-cl-surface/5 via-cl-surface/[0.03] to-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="order-1 lg:order-2 lg:col-span-6 xl:col-span-5">
              <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden border border-cl-border shadow-2xl">
                <DeferredPromoVideo src={partnerPromo} poster={image13} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>

            <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-7 text-center lg:text-left">
              <Badge>Official Partner</Badge>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold">
                Proud Partner of the IJSBA World Finals
              </h2>
              <p className="mt-3 text-cl-muted text-base leading-relaxed max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                Corner League is an official partner of the IJSBA World Finals
                in Lake Havasu. Follow live coverage, join event chatrooms, and
                explore racer profiles built just for AQUA sports.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-start justify-center">
                <Link href="/scores" className="sm:flex-1 sm:max-w-[240px]">
                  <Button className="w-full bg-cl-surface text-cl-ink hover:bg-cl-subtle rounded-full px-6">
                    See Event Hub
                  </Button>
                </Link>
                <Link href="/scores" className="sm:flex-1 sm:max-w-[240px]">
                  <Button className="w-full bg-cl-canvas text-cl-ink border border-cl-border hover:bg-black/90 rounded-full px-6">
                    Join the Chat
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Section>

        <LeagueMediaFeatures />

        {/* Partner / Sponsor banner */}
        <section className="px-5">
          <div className="mx-auto max-w-6xl rounded-2xl border border-cl-border bg-gradient-to-r from-cl-accent/20 via-cl-accent/20 to-amber-500/20 p-5 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
              <div className="text-left">
                <h3 className="text-xl md:text-2xl font-semibold">
                  Partner or Sponsor with Corner League
                </h3>
                <p className="mt-1 text-cl-ink text-sm md:text-base">
                  Want to reach passionate sports communities? Let’s team up.
                </p>
              </div>
              <div className="md:ml-auto">
                <Link href="/contact">
                  <Button className="bg-cl-surface text-cl-ink hover:bg-cl-subtle rounded-full px-6">
                    Get in touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      </div>
      <SiteFooter />
    </div>
  );
}

/* ───────── helpers (kept inside this file) ───────── */

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-5 ${className}`}>
      <div className="mx-auto max-w-6xl py-10 sm:py-12">{children}</div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full border border-cl-border bg-cl-subtle text-[11px] font-medium tracking-wide">
      {children}
    </span>
  );
}

function FeatureItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-xl border border-cl-border bg-cl-subtle p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-cl-muted leading-relaxed">
        {children}
      </div>
    </li>
  );
}
