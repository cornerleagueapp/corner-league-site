// pages/home.tsx
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/CL_Logo.png";
import { logout } from "@/lib/logout";
import { PageSEO } from "@/seo/usePageSEO";
import { useLocation } from "wouter";

import image1 from "@/assets/jetski1.jpg";
import image2 from "@/assets/jetski2.jpg";
import image3 from "@/assets/jetski3.jpg";
import image4 from "@assets/20250602_1433_Basketball Motion Scene_remix_01jws8ysn9fx1s6c0mgqw48t2g_1754356174336.png";
import image5 from "@assets/20250603_0933_Vibrant Portrait Art_remix_01jwva54bwfxrsakzx26a3y7mb_1754356174336.png";
import image6 from "@assets/20250603_1013_Floral Football Fusion_remix_01jwvcftvae0d90fjgdpsectw5_1754356174337.png";
import image7 from "@assets/20250603_1115_Cloud-Headed Baseball Players_remix_01jwvg1dcke14aa440wrbdq0ta_1754356174337.png";
import image8 from "@assets/20250603_1453_Knicks Jersey Style_remix_01jwvwgmraf65b5vd127wer3sq_1754356174338.png";
import image9 from "@assets/20250603_1551_Dodgers Ring in Ice_remix_01jwvzvdawfkt8dvx2xgn2mcm7_1754356174338.png";
import image10 from "@assets/20250604_0923_Penguin Hockey Player_remix_01jwxw19hzecka3510adds358m_1754356174339.png";
import image11 from "@assets/20250604_1204_Sports Professionals Crossing_remix_01jwy56gv4fd59rxawx2yepden_1754356174339.png";
import image12 from "@assets/20250604_1214_Iconic Street Crossing Athletes_remix_01jwy5s0jtfeyrwsjdk1m0eabq_1754356174340.png";
import image13 from "@/assets/jetski4.jpeg";
import image14 from "@assets/20250629_1952_Golf Reflection Scene_remix_01jyzbyafvfr492ch7je94md7k_1754357010886.png";
import image15 from "@assets/riveteammyles_A_Cristiano_Ronaldo_statue_wearing_his_jersey_i_fee2179e-7b83-45e7-965b-a4078e9c632b_1_1754357010886.png";
import image16 from "@assets/riveteammyles_A_hockey_player_with_retro-futuristic_NHL_hocke_d89a2adb-e717-4334-b7c8-29d96c171e1d_2_1754357010886.png";
import image17 from "@assets/riveteammyles_A_minimalistic_formula_1_racer_with_official_f1_9d20295a-d7ae-4472-98bd-709bf74b1987_2_1754357010887.png";
import image18 from "@assets/riveteammyles_A_minimalistic_surreal_fashion_photograph_of_an_66c7ec51-3ce0-4051-bee1-3afc4a1d4bc7_3_1754357010887.png";
import image19 from "@assets/riveteammyles_A_minimalistic_surreal_fashion_photograph_of_an_b996191c-ab67-4569-b9a4-e371b03fbfb3_0_1754357010887.png";
import image20 from "@assets/riveteammyles_A_photograph_of_an_Asian_female_model_a_NHL_Hoc_230d871d-9195-4ccf-9870-150c8d823af6_0_1754357010888.png";
import image21 from "@assets/riveteammyles_A_photorealistic_portrait_of_a_woman_with_short_77f27986-809b-4c3d-9069-3cd77fafc08e_3_1754357010888.png";
import image22 from "@/assets/jetski6.jpeg";
import image23 from "@assets/riveteammyles_Oil_painting_of_a_portrait_of_an_alien_man_with_8b00f3ad-c3e8-497c-8dbc-1f3cfd20b859_3_1754357010889.png";
import image24 from "@assets/riveteammyles_Photograph_of_a_white_humanoid_figure_in_a_full_8c88c8eb-769f-4c1e-9018-f7fe304c6374_0_1754357010890.png";
import image25 from "@assets/riveteammyles_Pink_Floyds_Dark_Side_of_the_Moon_album_cover_f_b68ced20-cd85-47eb-9ebc-6469ed8c7b96_0_1754357010890.png";
import image26 from "@/assets/mx1.jpg";
import image27 from "@/assets/mx2.jpeg";

import partner1 from "@/assets/fubo.png";
import partner2 from "@/assets/ibm.png";
import partner3 from "@/assets/fanatics.png";
import partner4 from "@/assets/google.png";
import partner5 from "@/assets/peloton.png";
import partner6 from "@/assets/ufc.png";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const sportsImages = [
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
    image7,
    image8,
    image9,
    image10,
    image11,
    image12,
    image13,
    image14,
    image15,
    image16,
    image17,
    image18,
    image19,
    image20,
    image21,
    image22,
    image23,
    image24,
    image25,
    image26,
    image27,
  ];

  const footerLinks = [
    "Why Corner League",
    "Clubs",
    "Insights",
    "Olympic AI",
    "Contact Us",
    "Terms/Privacy",
  ];

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
      <div className="background-scrolling absolute inset-0 z-0 overflow-hidden px-2">
        {Array.from({ length: 5 }).map((_, colIndex) => {
          const isHiddenOnMobile = colIndex >= 3;
          const columnImages = sportsImages.filter(
            (_, i) => i % 5 === colIndex
          );
          const limitedImages = isHiddenOnMobile
            ? columnImages
            : columnImages.slice(0, 8);
          const infiniteImages = [
            ...limitedImages,
            ...limitedImages,
            ...limitedImages,
          ];
          return (
            <div
              key={colIndex}
              className={`absolute top-0 flex flex-col gap-4 ${
                isHiddenOnMobile ? "hidden md:flex" : ""
              } bg-column-${colIndex}`}
              style={{
                left: `${colIndex * 20}%`,
                width: "20%",
                animation: `scrollUp${colIndex % 4} ${
                  120 + colIndex * 15
                }s linear infinite`,
                animationDelay: `${colIndex * -15}s`,
              }}
            >
              {infiniteImages.map((src, imgIndex) => (
                <div
                  key={`col-${colIndex}-${imgIndex}`}
                  className="w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg opacity-95 hover:opacity-100 transition-opacity duration-300"
                  style={{
                    height: `${180 + (imgIndex % 4) * 60}px`,
                    minHeight: "180px",
                  }}
                >
                  <img
                    src={src}
                    alt={`Sports artwork ${imgIndex + 1}`}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}
            </div>
          );
        })}
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
            <Link href="/scores">
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
              Made for Sports Lovers
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              The AI Sports Media hub to stream, chat, learn in-depth sports
              analysis, and engage with other sports fans around the world.
            </p>
            {isAuthenticated && (
              <p className="text-lg md:text-xl text-gray-300 mb-8 text-center">
                Welcome back, {user?.firstName ?? user?.email}!
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <div className="flex md:hidden flex-col sm:flex-row gap-4 items-center">
                  <Link href="/scores">
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
        {/* IJSBA Partner highlight */}
        <Section className="bg-gradient-to-b from-white/5 via-white/[0.03] to-transparent">
          <Badge>Official Partner</Badge>
          <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-center">
            Proud Partner of the IJSBA World Finals
          </h2>
          <p className="mt-3 text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto text-center">
            Corner League is an official partner of the IJSBA World Finals in
            Lake Havasu. Follow live coverage, join event chatrooms, and explore
            racer profiles built just for AQUA sports.
          </p>
          <div className="mt-5 w-full mx-auto max-w-md sm:max-w-xl lg:max-w-2xl">
            <div className="flex flex-col min-[400px]:flex-row gap-3 justify-center">
              <Link href="/scores" className="min-[400px]:flex-1">
                <Button className="w-full bg-white text-black hover:bg-white/90 rounded-full px-6">
                  See Event Hub
                </Button>
              </Link>
              <Link href="/scores" className="min-[400px]:flex-1">
                <Button className="w-full bg-black text-white border border-white/20 hover:bg-black/90 rounded-full px-6">
                  Join the Chat
                </Button>
              </Link>
            </div>
          </div>
        </Section>

        {/* What is Corner League */}
        <Section>
          <h2 className="text-2xl md:text-3xl font-semibold text-center">
            A Social Platform for Sports Fans
          </h2>
          <p className="mt-3 text-white/70 text-sm md:text-base leading-relaxed max-w-2xl mx-auto text-center">
            Discover clubs for your favorite teams, follow live scores, post
            highlights, react, and connect with fans everywhere. Corner League
            blends social conversations with real-time sports data.
          </p>

          <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
            <FeatureItem title="Clubs & Communities">
              Create or join team hubs and fan groups.
            </FeatureItem>
            <FeatureItem title="Live Scores & Threads">
              Follow games and chat in the moment.
            </FeatureItem>
            <FeatureItem title="Profiles & Reactions">
              Share posts, react, and build your fan identity.
            </FeatureItem>
            <FeatureItem title="AI Insights (coming soon)">
              Deep dives, summaries, and smart recaps.
            </FeatureItem>
          </ul>

          <div className="mt-6 flex justify-center">
            <Link href="/explore">
              <Button
                variant="outline"
                className="rounded-full px-6 text-black border-white/30 hover:bg-white/10 hover:text-white"
              >
                Explore the feed
              </Button>
            </Link>
          </div>
        </Section>

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
                  if (link === "Olympic AI") {
                    return (
                      <a
                        key={index}
                        href="https://www.olympicai.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-400 hover:text-white tracking-wider uppercase"
                      >
                        {link}
                      </a>
                    );
                  }
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
