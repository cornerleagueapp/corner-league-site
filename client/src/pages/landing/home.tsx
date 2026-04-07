import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/CL_Logo.png";
import { logout } from "@/lib/logout";
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

const footerLinks = [
  "Why Corner League",
  "Clubs",
  "Insights",
  // "Olympic AI",
  "Contact Us",
  "Terms/Privacy",
];
export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const handleLogin = () => {
    window.location.href = `/auth?next=${encodeURIComponent(location)}`;
  };
  const handleLogout = async () => {
    await logout("/auth");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative">
      <PageSEO
        title="Home"
        description="Discover public clubs or manage your own on Corner League. Join live communities for your favorite teams."
        canonicalPath="/"
        image="https://cornerleague.com/og/clubs.png"
      />

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
      <div className="background-scrolling">
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
                    className="relative bg-gray-900/20 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl"
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
                      loading="eager"
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

      {/* HERO */}
      <div className="hero-overlay relative z-10 min-h-screen flex flex-col">
        {/* Logo */}
        <div className="pt-8 pb-4 flex justify-center">
          <img
            src={logoPath}
            alt="Corner League Logo"
            className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
          />
        </div>

        {/* Auth actions (desktop) */}
        {isAuthenticated && (
          <div className="hidden md:flex absolute top-10 right-6 z-30 items-center gap-3">
            <Link href="/welcome">
              <Button
                size="sm"
                className="rounded-full px-5 py-2 text-sm font-semibold text-black bg-white hover:bg-gray-100"
              >
                My Scores
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full px-5 py-2 text-sm text-white border-white/40 bg-transparent hover:bg-white/10"
            >
              Logout
            </Button>
          </div>
        )}

        {/* Center hero text */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6 tracking-tight">
              Where Every Player Feels{" "}
              <span className="italic text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.9)]">
                PRO
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Corner League is the next-gen sports media platform that turns
              every rec and youth league into its own ESPN.
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Using AI to provide players their pro-style stats, game recaps,
              highlights, and leaderboards that make every game feel
              unforgettable and legendary!
            </p>
            {isAuthenticated && (
              <p className="text-lg md:text-xl text-gray-300 mb-8 text-center">
                Welcome, {user?.firstName ?? user?.email}!
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <div className="flex md:hidden flex-col sm:flex-row gap-4 items-center">
                  <Link href="/welcome">
                    <Button
                      size="lg"
                      className="px-8 py-4 text-lg font-semibold text-black bg-white hover:bg-gray-100 rounded-full"
                    >
                      My Scores
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    className="px-8 py-4 text-lg font-semibold text-white border-white/30 bg-transparent hover:bg-white/10 rounded-full"
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
                    className="px-8 py-4 text-lg font-semibold text-black border-white/30 hover:bg-white/10 rounded-full"
                  >
                    Log in
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleLogin}
                    className="px-8 py-4 text-lg font-semibold text-black bg-white hover:bg-gray-100 rounded-full"
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
          <div className="logo-carousel rounded-xl bg-white/[0.03] border border-white/10 py-5">
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
        <Section className="bg-gradient-to-b from-white/5 via-white/[0.03] to-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="order-1 lg:order-2 lg:col-span-6 xl:col-span-5">
              <div className="relative aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <video
                  src={partnerPromo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                  poster={image13}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            </div>

            <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-7 text-center lg:text-left">
              <Badge>Official Partner</Badge>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold">
                Proud Partner of the IJSBA World Finals
              </h2>
              <p className="mt-3 text-white/70 text-base leading-relaxed max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                Corner League is an official partner of the IJSBA World Finals
                in Lake Havasu. Follow live coverage, join event chatrooms, and
                explore racer profiles built just for AQUA sports.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:justify-start justify-center">
                <Link href="/scores" className="sm:flex-1 sm:max-w-[240px]">
                  <Button className="w-full bg-white text-black hover:bg-white/90 rounded-full px-6">
                    See Event Hub
                  </Button>
                </Link>
                <Link href="/scores" className="sm:flex-1 sm:max-w-[240px]">
                  <Button className="w-full bg-black text-white border border-white/20 hover:bg-black/90 rounded-full px-6">
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
          <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-600/20 via-violet-600/20 to-amber-500/20 p-5 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
              <div className="text-left">
                <h3 className="text-xl md:text-2xl font-semibold">
                  Partner or Sponsor with Corner League
                </h3>
                <p className="mt-1 text-white/80 text-sm md:text-base">
                  Want to reach passionate sports communities? Let’s team up.
                </p>
              </div>
              <div className="md:ml-auto">
                <Link href="/contact">
                  <Button className="bg-white text-black hover:bg-white/90 rounded-full px-6">
                    Get in touch
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 mt-10 border-t border-gray-700/50 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <nav className="flex flex-col md:flex-row md:justify-between items-center gap-6 md:gap-8 lg:gap-12">
            <div className="order-1 md:order-1">
              <a
                href="https://corner-league.ghost.io/about/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-400 hover:text-white tracking-wider uppercase"
              >
                <div className="text-center md:text-left">
                  <div>From One Fan</div>
                  <div>To the Next</div>
                </div>
              </a>
            </div>

            <div className="order-2 md:order-2 flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-12">
              {footerLinks
                .filter((link) => link !== "Why Corner League")
                .map((link, index) => {
                  if (link === "Clubs") {
                    return (
                      <Link
                        key={index}
                        href="/clubs"
                        className="text-sm font-medium text-gray-400 hover:text-white tracking-wider uppercase"
                      >
                        {link}
                      </Link>
                    );
                  }
                  // if (link === "Olympic AI") {
                  //   return (
                  //     <a
                  //       key={index}
                  //       href="https://www.olympicai.io/"
                  //       target="_blank"
                  //       rel="noopener noreferrer"
                  //       className="text-sm font-medium text-gray-400 hover:text-white tracking-wider uppercase"
                  //     >
                  //       {link}
                  //     </a>
                  //   );
                  // }
                  if (link === "Insights") {
                    return (
                      <a
                        key={index}
                        href="https://corner-league.ghost.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-400 hover:text-white tracking-wider uppercase"
                      >
                        {link}
                      </a>
                    );
                  }
                  if (link === "Contact Us") {
                    return (
                      <Link
                        key={index}
                        href="/contact"
                        className="text-sm font-medium text-gray-400 hover:text-white tracking-wider uppercase"
                      >
                        {link}
                      </Link>
                    );
                  }
                  return (
                    <Link
                      key={index}
                      href="/terms"
                      className="text-sm font-medium text-gray-400 hover:text-white tracking-wider uppercase"
                    >
                      {link}
                    </Link>
                  );
                })}
            </div>
          </nav>
        </div>
      </footer>
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
    <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] font-medium tracking-wide">
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
    <li className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-white/70 leading-relaxed">
        {children}
      </div>
    </li>
  );
}
