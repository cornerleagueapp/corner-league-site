import { Link } from "wouter";
import { ORGANIZATION_SIGNUP_URL } from "@/lib/organizationSignup";
export default function SiteFooter() {
  return (
    <footer className="relative mt-10 border-t border-cyan-300/15 bg-[#030913] px-5 py-10 text-white sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-xl font-black tracking-wide">
            CORNER LEAGUE<span className="ml-2 text-cyan-300">SPORTS</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-400">
            A home for athletes, fans and the organizations bringing sport to
            life. Follow the competition. Find your community.
          </p>
        </div>
        <nav aria-label="Explore Corner League" className="space-y-3">
          <h2 className="font-bold">Explore</h2>
          {[
            ["Sports hub", "/scores"],
            ["Community", "/community"],
            ["Stories & articles", "/articles"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="block w-fit text-sm text-slate-300 hover:text-cyan-200"
            >
              {label}
            </Link>
          ))}
        </nav>
        <nav
          aria-label="Corner League support and organizers"
          className="space-y-3"
        >
          <h2 className="font-bold">Get involved</h2>
          <Link
            href="/contact"
            className="block w-fit text-sm text-slate-300 hover:text-cyan-200"
          >
            Contact & support
          </Link>
          <a
            href={ORGANIZATION_SIGNUP_URL + "?mode=login"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-fit text-sm text-slate-300 hover:text-cyan-200"
          >
            Create your organization ↗
          </a>
          <a
            href="https://admin.cornerleague.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-fit text-sm text-slate-300 hover:text-cyan-200"
          >
            Organization dashboard ↗
          </a>
        </nav>
      </div>
      <div className="mx-auto mt-9 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Corner League. All rights reserved.</p>
        <Link href="/terms" className="hover:text-white">
          Terms & privacy
        </Link>
      </div>
    </footer>
  );
}
