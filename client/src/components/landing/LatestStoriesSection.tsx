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
              News
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-cl-accent sm:px-4 sm:text-[11px] sm:tracking-[0.24em]">
              Race Stories
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="max-w-4xl text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.04em] text-cl-ink min-[380px]:text-4xl sm:text-5xl lg:text-6xl">
                Latest <span className="cl-title-accent">Stories</span>
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-cl-muted sm:text-base">
                Follow race coverage, athlete stories, event updates, and
                community moments from across the jet ski racing world.
              </p>
            </div>

            <div className="rounded-2xl border border-cl-border bg-cl-subtle px-5 py-4 text-left shadow-cl-panel lg:text-right">
              <div className="text-3xl font-black text-cl-ink">
                {stories.length}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cl-muted">
                Stories
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {stories.map((story, idx) => (
              <Link key={story.id} href={story.href}>
                <article className="group min-w-0 cursor-pointer overflow-hidden rounded-[28px] border border-cl-accent/10 bg-cl-surface shadow-cl-panel transition duration-300 hover:-translate-y-1 hover:border-cl-accent/25 hover:bg-cl-accent/[0.035]">
                  <div className="relative overflow-hidden bg-cl-subtle">
                    <img
                      src={story.image}
                      alt={story.title}
                      className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      loading={idx === 0 ? "eager" : "lazy"}
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(2,5,10,0.76)_100%)]" />

                    <div className="cl-dark absolute left-4 top-4 rounded-full border border-cl-border bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cl-accent backdrop-blur">
                      {story.kicker}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cl-accent">
                      Corner League Coverage
                    </div>

                    <h3 className="mt-3 min-w-0 break-words text-2xl font-black uppercase leading-tight tracking-[-0.02em] text-cl-ink transition group-hover:text-cl-accent">
                      {story.title}
                    </h3>

                    <div className="mt-5 inline-flex rounded-full border border-cl-border bg-cl-subtle px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-cl-muted transition group-hover:border-cl-accent/20 group-hover:bg-cl-accent/10 group-hover:text-cl-accent">
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
