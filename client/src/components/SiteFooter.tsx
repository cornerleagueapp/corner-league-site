import NewsletterForm from "./marketing/NewsletterForm";
import { Link } from "wouter";
import { ORGANIZATION_SIGNUP_URL } from "@/lib/organizationSignup";
export default function SiteFooter() {
  return (
    <footer className="relative mt-10 border-t border-cl-accent/15 bg-cl-canvas px-5 py-10 text-cl-ink sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-xl font-black tracking-wide">
            CORNER LEAGUE<span className="ml-2 text-cl-accent">SPORTS</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-7 text-cl-muted">
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
              className="block w-fit text-sm text-cl-muted hover:text-cl-accent"
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
            className="block w-fit text-sm text-cl-muted hover:text-cl-accent"
          >
            Contact & support
          </Link>
          <a
            href={ORGANIZATION_SIGNUP_URL + "?mode=login"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-fit text-sm text-cl-muted hover:text-cl-accent"
          >
            Create your own Org ↗
          </a>
          <a
            href="https://admin.cornerleague.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-fit text-sm text-cl-muted hover:text-cl-accent"
          >
            Organization dashboard ↗
          </a>
        </nav>
      </div>
      <div className="mx-auto max-w-7xl">
        <NewsletterForm layout="footer" />
      </div>
      <div className="mx-auto mt-9 flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-cl-border pt-6 text-xs text-cl-muted">
        <p>© {new Date().getFullYear()} Corner League. All rights reserved.</p>
        <Link href="/terms" className="hover:text-cl-ink">
          Terms & privacy
        </Link>
      </div>
    </footer>
  );
}
