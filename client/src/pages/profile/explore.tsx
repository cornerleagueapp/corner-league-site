import { Link } from "wouter";

const destinations = [
  {
    title: "Your feed",
    description: "Catch up with the people and athletes you follow.",
    href: "/feed",
  },
  {
    title: "Community",
    description: "Join conversations with other sports fans.",
    href: "/community",
  },
  {
    title: "Articles",
    description: "Read stories and perspectives from the community.",
    href: "/articles",
  },
];

export default function ExploreFeedPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <header className="cl-panel-wash rounded-[28px] border border-cl-accent/20 p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-cl-accent">
          Corner League Community
        </p>
        <h1 className="mt-3 text-3xl font-black text-cl-ink sm:text-5xl">
          Explore
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-cl-muted">
          Find conversations, stories, and updates from across Corner League.
        </p>
      </header>
      <div className="grid gap-5 sm:grid-cols-3">
        {destinations.map(({ title, description, href }) => (
          <Link
            key={href}
            href={href}
            className="rounded-3xl border border-cl-border bg-cl-surface p-6 transition hover:border-cl-accent/40"
          >
            <h2 className="text-xl font-bold text-cl-ink">{title}</h2>
            <p className="mt-3 leading-7 text-cl-muted">{description}</p>
            <p className="mt-5 font-bold text-cl-accent">
              Explore {title.toLowerCase()} →
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
