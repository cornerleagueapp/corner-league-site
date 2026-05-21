import { Link } from "wouter";

type Story = {
  id: string;
  kicker: string;
  title: string;
  image: string;
  href: string;
};

export default function LatestStoriesSection({
  stories,
}: {
  stories: Story[];
}) {
  if (!stories.length) return null;

  return (
    <section id="latest-section" className="scroll-mt-24 pt-20">
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
              News
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#FFB199] sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Race Stories
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                Latest{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#FF7849_100%)] bg-clip-text text-transparent">
                  Stories
                </span>
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Follow race coverage, athlete stories, event updates, and
                community moments from across the jet ski racing world.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.25)] lg:text-right">
              <div className="text-3xl font-black text-white">
                {stories.length}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
                Stories
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {stories.map((story, idx) => (
              <Link key={story.id} href={story.href}>
                <article className="group min-w-0 cursor-pointer overflow-hidden rounded-[28px] border border-cyan-300/10 bg-[#07111F]/80 shadow-[0_24px_70px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-cyan-300/[0.035]">
                  <div className="relative overflow-hidden bg-white/[0.04]">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(2,5,10,0.76)_100%)]" />

                    <div className="absolute left-4 top-4 rounded-full border border-black/20 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100 backdrop-blur">
                      {story.kicker}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/60">
                      Corner League Coverage
                    </div>

                    <h3 className="mt-3 min-w-0 break-words text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-white transition group-hover:text-cyan-100">
                      {story.title}
                    </h3>

                    <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/65 transition group-hover:border-cyan-300/20 group-hover:bg-cyan-300/10 group-hover:text-cyan-100">
                      Read Story
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
