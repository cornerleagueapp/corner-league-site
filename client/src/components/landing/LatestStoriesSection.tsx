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
  return (
    <section id="latest-section" className="pt-20">
      <div className="mb-2 text-xs uppercase tracking-[0.28em] text-white/40">
        News
      </div>
      <h2 className="text-4xl font-black uppercase sm:text-5xl">
        Latest{" "}
        <span className="bg-[#ff9c9c]/25 px-2 text-[#ffb3b3]">Stories</span>
      </h2>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {stories.map((story) => (
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
  );
}
