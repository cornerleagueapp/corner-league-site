import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/CL Logo Mark-02_1754280692282.png";
import { CacheManager } from "@/lib/cacheManager";
import { apiRequest } from "@/lib/apiClient";
import { clearTokens } from "@/lib/token";
import { queryClient } from "@/lib/queryClient";
import { logout } from "@/lib/logout";

import image4 from "@assets/20250602_1433_Basketball Motion Scene_remix_01jws8ysn9fx1s6c0mgqw48t2g_1754356174336.png";
import image5 from "@assets/20250603_0933_Vibrant Portrait Art_remix_01jwva54bwfxrsakzx26a3y7mb_1754356174336.png";
import image6 from "@assets/20250603_1013_Floral Football Fusion_remix_01jwvcftvae0d90fjgdpsectw5_1754356174337.png";
import image7 from "@assets/20250603_1115_Cloud-Headed Baseball Players_remix_01jwvg1dcke14aa440wrbdq0ta_1754356174337.png";
import image8 from "@assets/20250603_1453_Knicks Jersey Style_remix_01jwvwgmraf65b5vd127wer3sq_1754356174338.png";
import image9 from "@assets/20250603_1551_Dodgers Ring in Ice_remix_01jwvzvdawfkt8dvx2xgn2mcm7_1754356174338.png";
import image10 from "@assets/20250604_0923_Penguin Hockey Player_remix_01jwxw19hzecka3510adds358m_1754356174339.png";
import image11 from "@assets/20250604_1204_Sports Professionals Crossing_remix_01jwy56gv4fd59rxawx2yepden_1754356174339.png";
import image12 from "@assets/20250604_1214_Iconic Street Crossing Athletes_remix_01jwy5s0jtfeyrwsjdk1m0eabq_1754356174340.png";

import image14 from "@assets/20250629_1952_Golf Reflection Scene_remix_01jyzbyafvfr492ch7je94md7k_1754357010886.png";
import image15 from "@assets/riveteammyles_A_Cristiano_Ronaldo_statue_wearing_his_jersey_i_fee2179e-7b83-45e7-965b-a4078e9c632b_1_1754357010886.png";
import image16 from "@assets/riveteammyles_A_hockey_player_with_retro-futuristic_NHL_hocke_d89a2adb-e717-4334-b7c8-29d96c171e1d_2_1754357010886.png";
import image17 from "@assets/riveteammyles_A_minimalistic_formula_1_racer_with_official_f1_9d20295a-d7ae-4472-98bd-709bf74b1987_2_1754357010887.png";
import image18 from "@assets/riveteammyles_A_minimalistic_surreal_fashion_photograph_of_an_66c7ec51-3ce0-4051-bee1-3afc4a1d4bc7_3_1754357010887.png";
import image19 from "@assets/riveteammyles_A_minimalistic_surreal_fashion_photograph_of_an_b996191c-ab67-4569-b9a4-e371b03fbfb3_0_1754357010887.png";
import image20 from "@assets/riveteammyles_A_photograph_of_an_Asian_female_model_a_NHL_Hoc_230d871d-9195-4ccf-9870-150c8d823af6_0_1754357010888.png";
import image21 from "@assets/riveteammyles_A_photorealistic_portrait_of_a_woman_with_short_77f27986-809b-4c3d-9069-3cd77fafc08e_3_1754357010888.png";

import image23 from "@assets/riveteammyles_Oil_painting_of_a_portrait_of_an_alien_man_with_8b00f3ad-c3e8-497c-8dbc-1f3cfd20b859_3_1754357010889.png";
import image24 from "@assets/riveteammyles_Photograph_of_a_white_humanoid_figure_in_a_full_8c88c8eb-769f-4c1e-9018-f7fe304c6374_0_1754357010890.png";
import image25 from "@assets/riveteammyles_Pink_Floyds_Dark_Side_of_the_Moon_album_cover_f_b68ced20-cd85-47eb-9ebc-6469ed8c7b96_0_1754357010890.png";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const sportsImages = [
    image4, // Basketball Motion Scene
    image5, // Vibrant Portrait Art
    image6, // Floral Football Fusion
    image7, // Cloud-Headed Baseball Players
    image8, // Knicks Jersey Style
    image9, // Dodgers Ring in Ice
    image10, // Penguin Hockey Player
    image11, // Sports Professionals Crossing
    image12, // Iconic Street Crossing Athletes
    image14, // Golf Reflection Scene
    image15, // Cristiano Ronaldo Statue
    image16, // Retro-Futuristic NHL Hockey
    image17, // Minimalistic Formula 1 Racer
    image18, // Surreal Fashion Sports
    image19, // Minimalistic Fashion Portrait
    image20, // Asian NHL Hockey Model
    image21, // Woman Portrait Underwater
    image23, // Oil Painting Alien Basketball
    image24, // White Humanoid Soccer Figure
    image25, // Pink Floyd Dark Side of the Moon
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
    window.location.href = "/auth";
  };

  const handleLogout = async () => {
    await logout("/auth");
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden relative">
      <style>{`
        @media (max-width: 767px) {
          .bg-column-0 { left: 0% !important; width: 33.33% !important; }
          .bg-column-1 { left: 33.33% !important; width: 33.33% !important; }
          .bg-column-2 { left: 66.66% !important; width: 33.33% !important; }
        }
      `}</style>
      {/* Background Image Collage - Vertical Scrolling Columns */}
      <div className="background-scrolling absolute inset-0 z-0 overflow-hidden px-2">
        {/* Mobile: Show 3 columns, Desktop: Show 5 columns */}
        {Array.from({ length: 5 }).map((_, colIndex) => {
          // Hide columns 3 and 4 on mobile (show only 0,1,2)
          const isHiddenOnMobile = colIndex >= 3;

          // Distribute images across all 5 columns for consistent distribution
          const columnImages = sportsImages.filter(
            (_, imgIndex) => imgIndex % 5 === colIndex
          );
          // On mobile columns, limit to fewer images for better performance
          const limitedImages = isHiddenOnMobile
            ? columnImages
            : columnImages.slice(0, 8);
          // Triple the images for seamless infinite scroll
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
                    height: `${180 + (imgIndex % 4) * 60}px`, // Heights between 180-360px
                    minHeight: "180px",
                  }}
                >
                  <img
                    src={src}
                    alt={`Sports artwork ${imgIndex + 1}`}
                    className="w-full h-full object-cover object-center"
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {/* Hero Section */}
      <div className="hero-overlay relative z-10 min-h-screen flex flex-col">
        {/* Logo Section */}
        <div className="pt-8 pb-4 flex justify-center">
          <img
            src={logoPath}
            alt="Company Logo"
            className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight mb-6 tracking-tight">
              Made for Sports Lovers
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              The AI Sports Media hub to stream, chat, learn in-depth sports
              analysis, and engage with other sports fans around the world.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <span className="text-lg text-gray-300">
                    Welcome back,{" "}
                    {(user as User)?.firstName || (user as User)?.email}!
                  </span>
                  <Link href="/clubs">
                    <Button
                      size="lg"
                      className="btn-join px-8 py-4 text-lg font-semibold text-black bg-white hover:bg-gray-100 transition-all duration-300 ease-out min-w-[120px] rounded-full"
                    >
                      My Clubs
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLogout}
                    className="btn-login px-8 py-4 text-lg font-semibold text-white border-white border-opacity-30 bg-transparent hover:bg-white hover:bg-opacity-10 hover:text-white transition-all duration-300 ease-out min-w-[120px] rounded-full"
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
                    className="btn-login px-8 py-4 text-lg font-semibold text-white border-white border-opacity-30 bg-transparent hover:bg-white hover:bg-opacity-10 hover:text-white transition-all duration-300 ease-out min-w-[120px] rounded-full"
                  >
                    Log in
                  </Button>

                  <Button
                    size="lg"
                    onClick={handleLogin}
                    className="btn-join px-8 py-4 text-lg font-semibold text-black bg-white hover:bg-gray-100 transition-all duration-300 ease-out min-w-[120px] rounded-full"
                  >
                    Join
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="relative z-20 border-t border-gray-700 border-opacity-50 bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <nav className="flex flex-col md:flex-row md:justify-between items-center gap-6 md:gap-8 lg:gap-12">
              {/* Mobile Center, Desktop Left - From One Fan */}
              <div className="order-1 md:order-1">
                <a
                  href="https://corner-league.ghost.io/about/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 tracking-wider uppercase"
                >
                  <div className="text-center md:text-left">
                    <div>From One Fan</div>
                    <div>To the Next</div>
                  </div>
                </a>
              </div>

              {/* Center/Bottom - Other links */}
              <div className="order-2 md:order-2 flex flex-wrap justify-center gap-6 md:gap-8 lg:gap-12">
                {footerLinks
                  .filter((link) => link !== "Why Corner League")
                  .map((link, index) => {
                    if (link === "Clubs") {
                      return (
                        <Link
                          key={index}
                          href="/clubs"
                          className="footer-link text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 tracking-wider uppercase"
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
                          className="footer-link text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 tracking-wider uppercase"
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
                          className="footer-link text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 tracking-wider uppercase"
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
                          className="footer-link text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 tracking-wider uppercase"
                        >
                          {link}
                        </Link>
                      );
                    }
                    return (
                      <Link
                        key={index}
                        href="/terms"
                        className="footer-link text-sm font-medium text-gray-400 hover:text-white transition-all duration-200 tracking-wider uppercase"
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
    </div>
  );
}
