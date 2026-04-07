import { Link } from "wouter";
import { PageSEO } from "@/seo/usePageSEO";
import logoPath from "@assets/CL_Logo.png";
import SpotifyPodcastSection from "@/components/SpotifyPodcastSection";

export default function ScoresLandingPage() {
  const stories = [
    {
      id: "1",
      kicker: "PRO WATERCROSS",
      title: "Pro Watercross – 2026 Economic Impact Form (Orange, TX)",
      description:
        "Thank you for participating! Your feedback helps Orange, Texas document the economic and community benefits of hosting watercraft racing events.",
      image:
        "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/13.webp",
      href: "/scores/aqua",
    },
    {
      id: "2",
      kicker: "IJSBA",
      title:
        "Pro Watercross and Jettribe Series of Champions announce 2026 kickoff",
      description:
        "A major opening stretch for the 2026 Aqua calendar is now underway with expanded anticipation around the season.",
      image:
        "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/20.webp",
      href: "/scores/aqua",
    },
    {
      id: "3",
      kicker: "EAST COAST WATERCROSS",
      title: "Results and recap from East Coast Watercross opening round",
      description:
        "Standings, recap coverage, and notable performances from the latest stop on the East Coast circuit.",
      image:
        "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/22.webp",
      href: "/scores/aqua",
    },
    {
      id: "4",
      kicker: "ORANGE, TEXAS",
      title: "Orange, Texas prepares for major watercraft race weekend",
      description:
        "The local event ecosystem continues to grow as race organizers and fans prepare for another busy stop.",
      image:
        "https://storage.googleapis.com/cl-beta-428221-app-assets/homePageAssets/24.webp",
      href: "/scores/aqua",
    },
  ];

  const topPerformers = [
    {
      rank: "01",
      name: "Revin Harris",
      className: "Pro Runabout GP",
      place: "1st",
    },
    {
      rank: "02",
      name: "Seddini Khalil",
      className: "Pro Runabout GP",
      place: "1st",
    },
    {
      rank: "03",
      name: "Kashe Crawford",
      className: "Junior Ski 13-15 Lites",
      place: "1st",
    },
    {
      rank: "04",
      name: "Jeremy Poper",
      className: "Master Ski GP",
      place: "1st",
    },
    {
      rank: "05",
      name: "Cash McClure",
      className: "Junior Ski 10-12",
      place: "1st",
    },
  ];

  const latestStories = stories.slice(0, 4);

  const matches = [
    {
      date: "Oct 12",
      time: "05:00",
      title: "Junior Ski 10-12 Ski Stock | Race 1 – Sunday",
    },
    { date: "Oct 12", time: "05:00", title: "Pro Ski GP | Race 2 – Sunday" },
    {
      date: "Oct 12",
      time: "05:00",
      title: "Junior Ski 13-15 Lites | Race 3 – Sunday",
    },
    {
      date: "Oct 12",
      time: "05:00",
      title: "Pro Am Women Ski Stock | Race 4 – Sunday",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <PageSEO
        title="Corner League Scores"
        description="Live scores, rankings, latest stories, and race schedules for Aqua jet ski competition."
        canonicalPath="/"
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/">
            <img src={logoPath} alt="Corner League" className="h-8 w-auto" />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <a
              href="#home-section"
              className="bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-black"
            >
              Home
            </a>
            <a
              href="#rankings-section"
              className="bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70"
            >
              Rankings
            </a>
            <a
              href="#latest-section"
              className="bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70"
            >
              Latest
            </a>
            <a
              href="#schedule-section"
              className="bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70"
            >
              Leagues
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/scores/aqua">
              <button className="bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Jet Ski
              </button>
            </Link>
            <Link href="/auth">
              <button className="bg-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Sign In
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <section
          id="home-section"
          className="grid gap-8 border-b border-white/10 pb-14 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="flex flex-col justify-center">
            <div className="mb-6 flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-white/40">
              <span className="h-px w-8 bg-white/20" />
              03 / 04
            </div>

            <div className="text-sm uppercase tracking-[0.22em] text-[#6B6BFF]">
              {stories[0].kicker}
            </div>

            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[0.98] sm:text-5xl lg:text-6xl">
              {stories[0].title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              {stories[0].description}
            </p>

            <div className="mt-8">
              <Link href={stories[0].href}>
                <button className="bg-white/10 px-6 py-4 text-sm font-medium text-white hover:bg-white/15">
                  Read Full Story →
                </button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 bg-[#1717ff]/10 blur-3xl" />
            <div className="relative border border-[#3A3AFF] p-2">
              <img
                src={stories[0].image}
                alt={stories[0].title}
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </section>

        <section id="rankings-section" className="pt-16">
          <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
            Rankings
          </div>
          <h2 className="text-4xl font-black uppercase sm:text-5xl">
            Leagues &{" "}
            <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">
              Top Performers
            </span>
          </h2>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "IJSBA",
              "Pro Watercross",
              "Nauti Water Racing",
              "JSRA",
              "IJSBA Europe",
              "IHRA",
              "East Coast Watercross",
            ].map((league) => (
              <button
                key={league}
                className="bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70 hover:bg-white/15"
              >
                {league}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="flex min-h-[420px] items-center justify-center bg-[linear-gradient(135deg,#6753a6_0%,#d6253d_55%,#f0a125_100%)] p-8">
              <div className="text-center text-5xl font-black uppercase text-white sm:text-6xl">
                Revin Harris
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white/45">
                IJSBA Standings
              </div>

              {topPerformers.map((person) => (
                <div
                  key={person.rank}
                  className="grid grid-cols-[60px_1fr_auto] items-center gap-4 border-b border-white/10 px-4 py-5"
                >
                  <div className="text-4xl font-black text-white/45">
                    {person.rank}
                  </div>
                  <div>
                    <div className="font-bold uppercase tracking-[0.06em] text-white">
                      {person.name}
                    </div>
                    <div className="mt-1 text-sm text-white/50">
                      {person.className}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {person.place}
                  </div>
                </div>
              ))}

              <div className="px-4 py-6">
                <Link href="/scores/aqua">
                  <button className="text-sm font-bold uppercase tracking-[0.18em] text-white hover:text-white/80">
                    View Full Rankings →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <SpotifyPodcastSection
          title="Wally's World WaterX Podcast"
          subtitle="Weekly updates from the racing world, featured stories, live interviews with racers, and more."
          showEmbedUrl="https://open.spotify.com/embed/show/0AJKS9cjhpd0DeYULPCsKT?utm_source=generator"
        />

        <section id="latest-section" className="pt-20">
          <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
            News
          </div>
          <h2 className="text-4xl font-black uppercase sm:text-5xl">
            Latest{" "}
            <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">Stories</span>
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {latestStories.map((story) => (
              <Link key={story.id} href={story.href}>
                <article className="group cursor-pointer">
                  <div className="overflow-hidden bg-white/5">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>

                  <div className="mt-5 text-xs uppercase tracking-[0.22em] text-white/45">
                    {story.kicker}
                  </div>

                  <h3 className="mt-3 text-2xl leading-tight text-white">
                    {story.title}
                  </h3>
                </article>
              </Link>
            ))}
          </div>
        </section>

        <section id="schedule-section" className="pt-20">
          <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
            Schedule
          </div>
          <h2 className="text-4xl font-black uppercase sm:text-5xl">
            This Week’s{" "}
            <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">Matches</span>
          </h2>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              "IJSBA",
              "Pro Watercross",
              "Nauti Water Racing",
              "JSRA",
              "IJSBA Europe",
              "IHRA",
              "East Coast Watercross",
            ].map((league) => (
              <button
                key={league}
                className="bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white/70 hover:bg-white/15"
              >
                {league}
              </button>
            ))}
          </div>

          <div className="mt-10 border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white/45">
              Previous Games
            </div>

            {matches.map((match, idx) => (
              <div
                key={idx}
                className="grid gap-4 border-b border-white/10 px-4 py-5 md:grid-cols-[130px_1fr_auto]"
              >
                <div>
                  <div className="text-2xl text-white/90">{match.date}</div>
                  <div className="text-white/40">{match.time}</div>
                </div>

                <div className="self-center text-xl font-bold uppercase tracking-[0.08em] text-white">
                  {match.title}
                </div>

                <div className="self-center">
                  <Link href="/scores/aqua">
                    <button className="border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
                      Results
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-20 border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 text-sm uppercase tracking-[0.18em] text-white/45 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>Corner League</div>
          <div className="flex flex-wrap gap-6">
            <Link href="/contact">Contact Us</Link>
            <Link href="/terms">Terms of Use</Link>
            <Link href="/terms">Privacy Policy</Link>
          </div>
          <div>© 2026 Corner League, Inc.</div>
        </div>
      </footer>
    </div>
  );
}
